import { createContext, useState, useCallback, useEffect } from "react";
import { API_BASE_URL, fetchWithRetry, getUserFriendlyError } from "./api-config";

/**
 * 🔐 AuthContext — Gestisce lo stato di autenticazione globale
 * 
 * Fornisce:
 * - token: JWT token salvato in localStorage
 * - user: dati utente (email, user_id)
 * - login/register/logout
 * 
 * Miglioramenti:
 * - Retry logic per errori di rete
 * - Messagi di errore user-friendly
 * - Timeout configurabile
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carica il token dal localStorage all'avvio
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const register = useCallback(async (email, password, locale = "it") => {
    try {
      console.log(`[Auth] Registrazione: ${email} (API: ${API_BASE_URL})`);
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, locale }),
        }
      );

      const data = await response.json();
      setToken(data.access_token);
      setUser({ email: data.email, user_id: data.user_id });
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify({ email: data.email, user_id: data.user_id }));
      
      console.log(`[Auth] Registrazione completata: ${email}`);
      return { success: true };
    } catch (err) {
      const errorMsg = getUserFriendlyError(err);
      console.error(`[Auth] Errore registrazione:`, err);
      return { success: false, error: errorMsg };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      console.log(`[Auth] Login: ${email} (API: ${API_BASE_URL})`);
      
      const response = await fetchWithRetry(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();
      setToken(data.access_token);
      setUser({ email: data.email, user_id: data.user_id });
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("auth_user", JSON.stringify({ email: data.email, user_id: data.user_id }));
      
      console.log(`[Auth] Login completato: ${email}`);
      return { success: true };
    } catch (err) {
      const errorMsg = getUserFriendlyError(err);
      console.error(`[Auth] Errore login:`, err);
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    console.log(`[Auth] Logout completato`);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
