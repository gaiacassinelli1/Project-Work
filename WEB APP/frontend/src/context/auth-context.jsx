/**
 * 🔐 AuthContext — Gestione globale dello stato di autenticazione
 * 
 * Fornisce:
 * - token: JWT token memorizzato in localStorage
 * - user: dati utente (email, user_id, locale)
 * - loading: stato di caricamento
 * - register/login/logout: funzioni di autenticazione
 * 
 * Persiste il token in localStorage per session recovery
 */

import { createContext, useState, useCallback, useEffect } from 'react';
import { authAPI, logAPIConfig } from '../api/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica il token dal localStorage al mount
  useEffect(() => {
    console.log('[Auth] Initializing auth context...');
    
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        console.log('[Auth] Sessione ripristinata per:', parsedUser.email);
      } catch (e) {
        console.error('[Auth] Errore nel parsing dell\'utente salvato:', e);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setLoading(false);
    
    // Log API config
    logAPIConfig();
  }, []);

  /**
   * Registra un nuovo utente
   */
  const register = useCallback(
    async (email, password, locale = 'it') => {
      setLoading(true);
      setError(null);

      try {
        console.log('[Auth] Inizio registrazione:', email);
        
        const result = await authAPI.register(email, password, locale);

        if (result.success) {
          const { access_token, email: userEmail, user_id } = result.data;
          
          // Salva in stato e localStorage
          setToken(access_token);
          setUser({ email: userEmail, user_id });
          
          localStorage.setItem('auth_token', access_token);
          localStorage.setItem(
            'auth_user',
            JSON.stringify({ email: userEmail, user_id })
          );
          
          console.log('[Auth] Registrazione completata:', email);
          return { success: true };
        } else {
          const errorMsg = result.error || 'Errore sconosciuto durante la registrazione';
          setError(errorMsg);
          console.error('[Auth] Errore registrazione:', errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err.message || 'Errore di connessione';
        setError(errorMsg);
        console.error('[Auth] Errore registrazione:', err);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Login utente
   */
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);

      try {
        console.log('[Auth] Inizio login:', email);
        
        const result = await authAPI.login(email, password);

        if (result.success) {
          const { access_token, email: userEmail, user_id } = result.data;
          
          // Salva in stato e localStorage
          setToken(access_token);
          setUser({ email: userEmail, user_id });
          
          localStorage.setItem('auth_token', access_token);
          localStorage.setItem(
            'auth_user',
            JSON.stringify({ email: userEmail, user_id })
          );
          
          console.log('[Auth] Login completato:', email);
          return { success: true };
        } else {
          const errorMsg = result.error || 'Errore sconosciuto durante il login';
          setError(errorMsg);
          console.error('[Auth] Errore login:', errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err.message || 'Errore di connessione';
        setError(errorMsg);
        console.error('[Auth] Errore login:', err);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
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
      // Continua comunque con il logout locale
    } finally {
      // Pulisci lo stato locale
      setToken(null);
      setUser(null);
      setError(null);
      
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      console.log('[Auth] Logout completato');
      setLoading(false);
    }
  }, [token]);

  /**
   * Valida il token (utile per verificare se ancora valido)
   */
  const validateToken = useCallback(
    async () => {
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
          logout();
          return false;
        }
      } catch (err) {
        console.error('[Auth] Errore nella validazione del token:', err);
        return false;
      }
    },
    [token, logout]
  );

  // Log dei cambiamenti di stato (debug)
  useEffect(() => {
    console.log('[Auth] Stato cambiato:', {
      isAuthenticated: !!token,
      hasUser: !!user,
      loading,
      email: user?.email,
    });
  }, [token, user, loading]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        register,
        login,
        logout,
        validateToken,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
