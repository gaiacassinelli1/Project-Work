/**
 * 🔧 API Configuration — Configurazione centralizzata per API calls
 * 
 * Gestisce:
 * - URL del backend (dev vs prod)
 * - Timeout e retry logic
 * - Error handling user-friendly
 * - Logging
 */

// Determina l'URL del backend in base all'ambiente
const isDevelopment = import.meta.env.MODE === 'development';

export const API_CONFIG = {
  // URL base dell'API
  BASE_URL: isDevelopment 
    ? '/api'  // Usa proxy Vite in development
    : (import.meta.env.VITE_API_BASE_URL || '/api'),  // URL assoluto o relativo in production
  
  // Timeout per le richieste (ms)
  TIMEOUT: 10000,
  
  // Numero di retry per errori di rete temporanei
  RETRY_COUNT: 2,
  
  // Delay tra retry (ms)
  RETRY_DELAY: 500,
  
  // Headers di default
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  }
};

// ─────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────

/**
 * Verifica se un errore è di rete (e quindi retriable)
 */
function isNetworkError(error) {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('refused') ||
    message.includes('econnrefused') ||
    error instanceof TypeError
  );
}

/**
 * Converte gli HTTP status code in messaggi user-friendly
 */
export function getErrorMessage(error, statusCode = null) {
  if (!error) return 'Errore sconosciuto';
  
  const message = error.message || error.toString();
  
  // Errori di connessione
  if (message.includes('Failed to fetch') || statusCode === 0) {
    return {
      title: 'Backend non raggiungibile',
      message: 'Verifica che il server sia in esecuzione su localhost:8000',
      isNetworkError: true
    };
  }
  
  if (message.includes('Timeout') || message.includes('timeout')) {
    return {
      title: 'Richiesta scaduta',
      message: 'Il server sta impiegando troppo tempo a rispondere',
      isNetworkError: true
    };
  }
  
  if (message.includes('refused')) {
    return {
      title: 'Connessione rifiutata',
      message: 'Il backend non è in esecuzione',
      isNetworkError: true
    };
  }
  
  // Errori HTTP dal server
  if (statusCode === 400) {
    return {
      title: 'Dati non validi',
      message: error.detail || 'I dati forniti non sono validi',
      isNetworkError: false
    };
  }
  
  if (statusCode === 401) {
    return {
      title: 'Non autorizzato',
      message: 'Il token è scaduto o non valido. Accedi di nuovo.',
      isNetworkError: false,
      isAuthError: true
    };
  }
  
  if (statusCode === 409) {
    return {
      title: 'Conflitto',
      message: error.detail || 'Questa risorsa esiste già',
      isNetworkError: false
    };
  }
  
  if (statusCode === 500) {
    return {
      title: 'Errore server',
      message: 'Si è verificato un errore nel server. Riprova più tardi.',
      isNetworkError: false
    };
  }
  
  if (statusCode && statusCode >= 400) {
    return {
      title: `Errore HTTP ${statusCode}`,
      message: error.detail || message,
      isNetworkError: false
    };
  }
  
  // Default
  return {
    title: 'Errore',
    message: message,
    isNetworkError: false
  };
}

/**
 * Effettua una richiesta HTTP con timeout, retry, e error handling
 */
export async function fetchWithRetry(
  endpoint,
  options = {},
  retryCount = 0
) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_CONFIG.BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Estrai il body
    let body = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      body = await response.json();
    }

    // Verifica lo status
    if (!response.ok) {
      const error = new Error(body?.detail || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = body;
      throw error;
    }

    return {
      ok: true,
      status: response.status,
      data: body,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry su errori di rete temporanei
    if (retryCount < API_CONFIG.RETRY_COUNT && isNetworkError(error)) {
      console.warn(
        `[API] Retry ${retryCount + 1}/${API_CONFIG.RETRY_COUNT} per ${url}`
      );
      
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1))
      );
      
      return fetchWithRetry(endpoint, options, retryCount + 1);
    }

    // Non retriable o retry esaurito
    return {
      ok: false,
      status: error.status || 0,
      error: error,
      message: getErrorMessage(error, error.status),
    };
  }
}

/**
 * Log della configurazione API (debug)
 */
export function logAPIConfig() {
  const config = {
    mode: import.meta.env.MODE,
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    retryCount: API_CONFIG.RETRY_COUNT,
  };
  
  console.log('[API Config]', config);
  
  return config;
}
