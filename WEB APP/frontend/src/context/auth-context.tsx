/**
 * 🔐 AuthContext — Gestione globale dello stato di autenticazione
 * 
 * Fornisce:
 * - token: JWT access token memorizzato in localStorage
 * - refreshToken: JWT refresh token per rinnovare il token
 * - user: dati utente (email, user_id, locale)
 * - loading: stato di caricamento
 * - register/login/logout: funzioni di autenticazione
 * - refreshAccessToken: rinnova il token automaticamente
 * 
 * Persiste i token in localStorage per session recovery
 * Monitora l'expiry del token e lo rinfresca automaticamente
 */

import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authAPI } from '../api/api';
import { logAPIConfig } from '../api/api-config';
import type { AuthContextType, User } from '../types';

export const AuthContext = createContext<AuthContextType | null>(null);

// Helper per decodare JWT e leggere l'expiry
function getTokenExpiry(token: string): number | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload) as { exp: number };
    return payload.exp * 1000; // Converti a millisecondi
  } catch (e) {
    console.error('[Auth] Errore nel decodare token:', e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenRefreshTimer, setTokenRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Carica i token dal localStorage al mount
  useEffect(() => {
    console.log('[Auth] Initializing auth context...');
    
    const savedToken = localStorage.getItem('auth_token');
    const savedRefreshToken = localStorage.getItem('auth_refresh_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setToken(savedToken);
        setRefreshToken(savedRefreshToken);
        setUser(parsedUser);
        console.log('[Auth] Sessione ripristinata per:', parsedUser.email);
        
        // Imposta un timer per rinnovare il token prima che scada
        scheduleTokenRefresh(savedToken, savedRefreshToken);
      } catch (e) {
        console.error('[Auth] Errore nel parsing dei dati salvati:', e);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
      }
    }

    setLoading(false);
    
    // Log API config
    logAPIConfig();
  }, []);

  /**
   * Rinnova l'access token usando il refresh token
   */
  const refreshAccessToken = useCallback(
    async (currentRefreshToken: string | null): Promise<boolean> => {
      if (!currentRefreshToken) {
        console.warn('[Auth] Refresh token non disponibile');
        await logout();
        return false;
      }

      try {
        console.log('[Auth] Rinnovando access token...');
        
        const result = await authAPI.refreshToken(currentRefreshToken);

        if (result.success && result.data) {
          const {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
          } = result.data;

          setToken(newAccessToken);
          setRefreshToken(newRefreshToken);

          localStorage.setItem('auth_token', newAccessToken);
          localStorage.setItem('auth_refresh_token', newRefreshToken);

          console.log('[Auth] Access token rinnovato');
          
          // Reschedula il refresh per il nuovo token
          scheduleTokenRefresh(newAccessToken, newRefreshToken);
          
          return true;
        } else {
          console.warn('[Auth] Errore nel refresh:', result.error);
          await logout();
          return false;
        }
      } catch (err) {
        console.error('[Auth] Errore durante refresh:', err);
        await logout();
        return false;
      }
    },
    []
  );

  /**
   * Imposta un timer per rinnovare il token 5 minuti prima della scadenza
   */
  const scheduleTokenRefresh = useCallback(
    (accessToken: string, currentRefreshToken: string | null) => {
      // Pulisci il timer precedente
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
      }

      const expiry = getTokenExpiry(accessToken);
      if (!expiry) {
        console.warn('[Auth] Impossibile leggere expiry del token');
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = expiry - now;
      const refreshBeforeExpiry = 5 * 60 * 1000; // 5 minuti prima della scadenza

      if (timeUntilExpiry > refreshBeforeExpiry) {
        const delay = timeUntilExpiry - refreshBeforeExpiry;
        console.log(
          `[Auth] Timer di refresh impostato per ${Math.round(delay / 1000 / 60)} minuti`
        );

        const timer = setTimeout(() => {
          refreshAccessToken(currentRefreshToken);
        }, delay);

        setTokenRefreshTimer(timer);
      } else if (timeUntilExpiry > 0) {
        // Token sta per scadere, rinnova subito
        console.log('[Auth] Token sta per scadere, rinnovando adesso...');
        refreshAccessToken(currentRefreshToken);
      } else {
        // Token già scaduto
        console.warn('[Auth] Token scaduto, logout');
        logout();
      }
    },
    [tokenRefreshTimer, refreshAccessToken]
  );

  /**
   * Registra un nuovo utente
   */
  const register = useCallback(
    async (email: string, password: string, locale: string = 'it'): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        console.log('[Auth] Inizio registrazione:', email);
        
        const result = await authAPI.register(email, password, locale);

        if (result.success && result.data) {
          const {
            access_token,
            refresh_token,
            email: userEmail,
            user_id,
          } = result.data;

          setToken(access_token);
          setRefreshToken(refresh_token);
          setUser({ email: userEmail, user_id } as User);

          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('auth_refresh_token', refresh_token);
          localStorage.setItem(
            'auth_user',
            JSON.stringify({ email: userEmail, user_id })
          );

          console.log('[Auth] Registrazione completata:', email);
          
          // Imposta il timer di refresh
          scheduleTokenRefresh(access_token, refresh_token);
          
          return { success: true };
        } else {
          const errorMsg =
            result.error || 'Errore sconosciuto durante la registrazione';
          setError(errorMsg);
          console.error('[Auth] Errore registrazione:', errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Errore di connessione';
        setError(errorMsg);
        console.error('[Auth] Errore registrazione:', err);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [scheduleTokenRefresh]
  );

  /**
   * Login utente
   */
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        console.log('[Auth] Inizio login:', email);
        
        const result = await authAPI.login(email, password);

        if (result.success && result.data) {
          const {
            access_token,
            refresh_token,
            email: userEmail,
            user_id,
          } = result.data;

          setToken(access_token);
          setRefreshToken(refresh_token);
          setUser({ email: userEmail, user_id } as User);

          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('auth_refresh_token', refresh_token);
          localStorage.setItem(
            'auth_user',
            JSON.stringify({ email: userEmail, user_id })
          );

          console.log('[Auth] Login completato:', email);
          
          // Imposta il timer di refresh
          scheduleTokenRefresh(access_token, refresh_token);
          
          return { success: true };
        } else {
          const errorMsg =
            result.error || 'Errore sconosciuto durante il login';
          setError(errorMsg);
          console.error('[Auth] Errore login:', errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Errore di connessione';
        setError(errorMsg);
        console.error('[Auth] Errore login:', err);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [scheduleTokenRefresh]
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setLoading(true);

    try {
      // Chiama il logout nel backend (opzionale, per logging)
      if (token) {
        await authAPI.logout(token);
      }
    } catch (err) {
      console.warn('[Auth] Errore durante logout nel backend:', err);
    } finally {
      // Pulisci il timer
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
        setTokenRefreshTimer(null);
      }

      // Pulisci lo stato locale
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setError(null);

      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');

      console.log('[Auth] Logout completato');
      setLoading(false);
    }
  }, [token, tokenRefreshTimer]);

  /**
   * Valida il token (utile per verificare se ancora valido)
   */
  const validateToken = useCallback(async (): Promise<boolean> => {
    if (!token) {
      return false;
    }

    try {
      const result = await authAPI.getMe(token);

      if (result.success) {
        console.log('[Auth] Token valido');
        return true;
      } else {
        console.warn('[Auth] Token non valido, logout');
        await logout();
        return false;
      }
    } catch (err) {
      console.error('[Auth] Errore nella validazione del token:', err);
      return false;
    }
  }, [token, logout]);

  // Log dei cambiamenti di stato (debug)
  useEffect(() => {
    console.log('[Auth] Stato cambiato:', {
      isAuthenticated: !!token,
      hasUser: !!user,
      hasRefreshToken: !!refreshToken,
      loading,
      email: user?.email,
    });
  }, [token, refreshToken, user, loading]);

  const value: AuthContextType = {
    token,
    refreshToken,
    user,
    loading,
    error,
    register,
    login,
    logout,
    validateToken,
    refreshAccessToken,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
