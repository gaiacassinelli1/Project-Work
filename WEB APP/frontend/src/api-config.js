/**
 * 🔧 API Configuration — Centralizza le impostazioni API
 * 
 * In development: usa il proxy Vite (/api → http://localhost:8000)
 * In production: usa l'URL dal .env file
 * 
 * Configurazione:
 * - Dev: /api (proxy to http://localhost:8000)
 * - Prod: VITE_API_BASE_URL da .env o import.meta.env.VITE_API_BASE_URL
 */

// URL del backend (configurabile)
// Development: usa proxy relativo (/api)
// Production: configura VITE_API_BASE_URL nel .env
const isDevelopment = import.meta.env.MODE === 'development';
export const API_BASE_URL = isDevelopment 
  ? "/api"  // Usa proxy Vite in development (evita CORS)
  : (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api");  // URL assoluto in production

// Timeout per le richieste (ms)
export const API_TIMEOUT = 10000;

// Numero di retry per fallimenti temporanei
export const API_RETRY_COUNT = 2;

// Delay tra retry (ms)
export const API_RETRY_DELAY = 500;

/**
 * Helper per fare richieste con timeout e retry
 */
export async function fetchWithRetry(url, options = {}, retryCount = 0) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout della richiesta")), API_TIMEOUT)
  );

  try {
    const response = await Promise.race([
      fetch(url, options),
      timeout,
    ]);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMessage = data.detail || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    // Retry su errori di rete temporanei
    if (retryCount < API_RETRY_COUNT && isNetworkError(error)) {
      console.warn(`Retry ${retryCount + 1}/${API_RETRY_COUNT} per ${url}`);
      await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY));
      return fetchWithRetry(url, options, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Verifica se l'errore è di rete (e quindi retriable)
 */
function isNetworkError(error) {
  const message = error.message.toLowerCase();
  return (
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("refused") ||
    error instanceof TypeError
  );
}

/**
 * Restituisce un messaggio di errore user-friendly
 */
export function getUserFriendlyError(error) {
  if (!error) return "Errore sconosciuto";

  const message = error.message || error.toString();

  // Errori di connessione
  if (message.includes("Failed to fetch")) {
    return "⚠️ Backend non raggiungibile. Verifica che il server sia in esecuzione su localhost:8000";
  }
  if (message.includes("Timeout")) {
    return "⏱️ Richiesta scaduta. Il server sta impiegando troppo tempo a rispondere.";
  }
  if (message.includes("refused")) {
    return "🔌 Connessione rifiutata. Il backend non è in esecuzione.";
  }
  if (message.includes("network")) {
    return "🌐 Errore di rete. Verifica la tua connessione internet.";
  }

  // Errori di validazione/autenticazione (dal server)
  if (message.includes("Email già registrata")) {
    return message;
  }
  if (message.includes("Email o password")) {
    return message;
  }

  // Default
  return `❌ ${message}`;
}

/**
 * Debug: stampa informazioni sulla configurazione API
 */
export function logAPIConfig() {
  console.log(`[API Config] Mode: ${import.meta.env.MODE}`);
  console.log(`[API Config] Base URL: ${API_BASE_URL}`);
  console.log(`[API Config] Timeout: ${API_TIMEOUT}ms`);
  console.log(`[API Config] Retry count: ${API_RETRY_COUNT}`);
}
