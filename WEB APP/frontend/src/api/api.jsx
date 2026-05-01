/**
 * 🔐 API Utilities — Funzioni per l'interazione con l'API di autenticazione
 * 
 * Fornisce:
 * - apiRequest: funzione base con error handling
 * - authAPI: funzioni specifiche per auth (register, login, getMe)
 * - Gestione automatica del token Bearer
 */

import { fetchWithRetry, getErrorMessage, API_CONFIG } from '../api-config';

/**
 * Effettua una richiesta API generica
 */
export async function apiRequest(
  endpoint,
  options = {},
  token = null
) {
  const headers = options.headers || {};

  // Aggiungi il token se fornito
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const result = await fetchWithRetry(endpoint, {
    ...options,
    headers,
  });

  if (!result.ok) {
    const errorInfo = result.message || getErrorMessage(result.error, result.status);
    throw new Error(errorInfo.message || JSON.stringify(result.error));
  }

  return result.data;
}

/**
 * Effettua una richiesta GET
 */
export async function apiGet(endpoint, token = null) {
  return apiRequest(endpoint, { method: 'GET' }, token);
}

/**
 * Effettua una richiesta POST
 */
export async function apiPost(endpoint, data = {}, token = null) {
  return apiRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token
  );
}

/**
 * Effettua una richiesta PUT
 */
export async function apiPut(endpoint, data = {}, token = null) {
  return apiRequest(
    endpoint,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    token
  );
}

/**
 * Effettua una richiesta DELETE
 */
export async function apiDelete(endpoint, token = null) {
  return apiRequest(endpoint, { method: 'DELETE' }, token);
}

// ─────────────────────────────────────────────────
// Authentication API
// ─────────────────────────────────────────────────

export const authAPI = {
  /**
   * Registra un nuovo utente
   */
  async register(email, password, locale = 'it') {
    try {
      console.log('[AuthAPI] Registrazione:', email);
      
      const data = await apiPost('/auth/register', {
        email,
        password,
        locale,
      });

      console.log('[AuthAPI] Registrazione riuscita:', email);
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[AuthAPI] Errore registrazione:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Login utente
   */
  async login(email, password) {
    try {
      console.log('[AuthAPI] Login:', email);
      
      const data = await apiPost('/auth/login', {
        email,
        password,
      });

      console.log('[AuthAPI] Login riuscito:', email);
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[AuthAPI] Errore login:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Ottiene i dati dell'utente autenticato
   */
  async getMe(token) {
    try {
      console.log('[AuthAPI] Fetch user data');
      
      const data = await apiGet('/auth/me', token);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[AuthAPI] Errore fetch user:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Logout (backend side)
   */
  async logout(token) {
    try {
      console.log('[AuthAPI] Logout');
      
      const data = await apiPost('/auth/logout', {}, token);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[AuthAPI] Errore logout:', error.message);
      // Logout fallisce ma comunque elimina il token
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const data = await apiGet('/auth/health');
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// ─────────────────────────────────────────────────
// Game API
// ─────────────────────────────────────────────────

export const gameAPI = {
  /**
   * Registra un evento (check-in, etc)
   */
  async createEvent(eventType, metadata, token) {
    return apiPost(
      '/events',
      {
        event_type: eventType,
        metadata,
      },
      token
    );
  },

  /**
   * Fetcha i pesci dell'utente
   */
  async getFish(userId, token) {
    return apiGet(`/user/${userId}/fish`, token);
  },

  /**
   * Fetcha lo stato del mare
   */
  async getSeaState(userId, token) {
    return apiGet(`/user/${userId}/sea-state`, token);
  },

  /**
   * Ricalcola lo stato (pesci e mare)
   */
  async computeState(userId, token) {
    return apiPost(`/user/${userId}/compute-state`, {}, token);
  },

  /**
   * Esporta i dati dell'utente
   */
  async exportData(userId, token) {
    return apiGet(`/user/${userId}/export-data`, token);
  },

  /**
   * Sincronizza con MongoDB
   */
  async syncToMongoDB(userId, token) {
    return apiPost(`/user/${userId}/export-mongodb`, {}, token);
  },

  /**
   * Fetcha analytics
   */
  async getAnalytics(userId, token) {
    return apiGet(`/user/${userId}/analytics`, token);
  },
};
