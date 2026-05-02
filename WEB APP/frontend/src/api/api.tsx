/**
 * 🔐 API Utilities — Funzioni per l'interazione con l'API di autenticazione
 * 
 * Fornisce:
 * - apiRequest: funzione base con error handling
 * - authAPI: funzioni specifiche per auth (register, login, getMe, refreshToken)
 * - gameAPI: funzioni per il gameplay
 * - Gestione automatica del token Bearer
 */

import { fetchWithRetry, getErrorMessage, API_CONFIG } from './api-config.tsx';
import type { 
  ApiResponse, 
  AuthResponse, 
  UserResponse, 
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../types.ts';

/**
 * Effettua una richiesta API generica
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token: string | null = null
): Promise<unknown> {
  const headers: HeadersInit = options.headers || {};

  // Aggiungi il token se fornito
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const result = await fetchWithRetry(endpoint, {
    ...options,
    headers,
  });

  if (!result.ok) {
    const errorInfo = getErrorMessage(result.error, result.status);
    throw new Error(errorInfo.message || JSON.stringify(result.error));
  }

  return result.data;
}

/**
 * Effettua una richiesta GET
 */
export async function apiGet(
  endpoint: string,
  token: string | null = null
): Promise<unknown> {
  return apiRequest(endpoint, { method: 'GET' }, token);
}

/**
 * Effettua una richiesta POST
 */
export async function apiPost(
  endpoint: string,
  data: Record<string, unknown> = {},
  token: string | null = null
): Promise<unknown> {
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
export async function apiPut(
  endpoint: string,
  data: Record<string, unknown> = {},
  token: string | null = null
): Promise<unknown> {
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
export async function apiDelete(
  endpoint: string,
  token: string | null = null
): Promise<unknown> {
  return apiRequest(endpoint, { method: 'DELETE' }, token);
}

// ─────────────────────────────────────────────────────────────
// Authentication API
// ─────────────────────────────────────────────────────────────

export const authAPI = {
  /**
   * Registra un nuovo utente
   */
  async register(
    email: string,
    password: string,
    locale: string = 'it'
  ): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('[AuthAPI] Registrazione:', email);
      
      const data = await apiPost('/auth/register', {
        email,
        password,
        locale,
      }) as AuthResponse;

      console.log('[AuthAPI] Registrazione riuscita:', email);
      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('[AuthAPI] Errore registrazione:', message);
      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Login utente
   */
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('[AuthAPI] Login:', email);
      
      const data = await apiPost('/auth/login', {
        email,
        password,
      }) as AuthResponse;

      console.log('[AuthAPI] Login riuscito:', email);
      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('[AuthAPI] Errore login:', message);
      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Rinnova l'access token usando il refresh token
   */
  async refreshToken(
    refreshToken: string
  ): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('[AuthAPI] Refresh token...');
      
      const data = await apiPost('/auth/refresh', {
        refresh_token: refreshToken,
      }) as AuthResponse;

      console.log('[AuthAPI] Token rinnovato');
      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('[AuthAPI] Errore refresh token:', message);
      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Ottiene i dati dell'utente autenticato
   */
  async getMe(token: string): Promise<ApiResponse<UserResponse>> {
    try {
      console.log('[AuthAPI] Fetch user data');
      
      const data = await apiGet('/auth/me', token) as UserResponse;

      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('[AuthAPI] Errore fetch user:', message);
      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Logout (backend side)
   */
  async logout(token: string): Promise<ApiResponse<unknown>> {
    try {
      console.log('[AuthAPI] Logout');
      
      const data = await apiPost('/auth/logout', {}, token);

      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('[AuthAPI] Errore logout:', message);
      // Logout fallisce ma comunque elimina il token
      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Richiesta di reset password
   */
  async forgotPassword(email: string): Promise<ApiResponse<unknown>> {
    try {
      console.log('[AuthAPI] Forgot password:', email);
      
      const data = await apiPost('/auth/forgot-password', {
        email,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('[AuthAPI] Errore forgot password:', message);
      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Reset password con token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<unknown>> {
    try {
      console.log('[AuthAPI] Reset password...');
      
      const data = await apiPost('/auth/reset-password', {
        token,
        new_password: newPassword,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('[AuthAPI] Errore reset password:', message);
      return {
        success: false,
        error: message,
      };
    }
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<unknown>> {
    try {
      const data = await apiGet('/auth/health');
      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      return {
        success: false,
        error: message,
      };
    }
  },
};

// ─────────────────────────────────────────────────────────────
// Game API
// ─────────────────────────────────────────────────────────────

export const gameAPI = {
  /**
   * Registra un evento (check-in, etc)
   */
  async createEvent(
    eventType: string,
    metadata: Record<string, unknown>,
    token: string
  ): Promise<unknown> {
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
  async getFish(userId: string, token: string): Promise<unknown> {
    return apiGet(`/user/${userId}/fish`, token);
  },

  /**
   * Fetcha lo stato del mare
   */
  async getSeaState(userId: string, token: string): Promise<unknown> {
    return apiGet(`/user/${userId}/sea-state`, token);
  },

  /**
   * Ricalcola lo stato (pesci e mare)
   */
  async computeState(userId: string, token: string): Promise<unknown> {
    return apiPost(`/user/${userId}/compute-state`, {}, token);
  },

  /**
   * Esporta i dati dell'utente
   */
  async exportData(userId: string, token: string): Promise<unknown> {
    return apiGet(`/user/${userId}/export-data`, token);
  },

  /**
   * Sincronizza con MongoDB
   */
  async syncToMongoDB(userId: string, token: string): Promise<unknown> {
    return apiPost(`/user/${userId}/export-mongodb`, {}, token);
  },

  /**
   * Fetcha analytics
   */
  async getAnalytics(userId: string, token: string): Promise<unknown> {
    return apiGet(`/user/${userId}/analytics`, token);
  },
};
