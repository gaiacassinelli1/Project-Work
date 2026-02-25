/**
 * 🌊 API Utility — Gestisce richieste autenticate al backend
 * 
 * Aggiunge automaticamente il JWT token da localStorage
 */

const API_BASE = "http://localhost:8000/api";

/**
 * Richiesta GET autenticata
 */
export async function apiGet(endpoint, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Richiesta POST autenticata
 */
export async function apiPost(endpoint, data, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Submit un check-in al backend
 */
export async function submitCheckIn(userId, checkpoint, token) {
  return apiPost("/events", {
    user_id: userId,
    event_type: "check_in",
    metadata: checkpoint,
  }, token);
}

/**
 * Fetch i pesci dell'utente
 */
export async function fetchFish(userId, token) {
  return apiGet(`/user/${userId}/fish`, token);
}

/**
 * Fetch lo stato del mare
 */
export async function fetchSeaState(userId, token) {
  return apiGet(`/user/${userId}/sea-state`, token);
}

/**
 * Ricalcola lo stato dei pesci e del mare
 */
export async function computeState(userId, token) {
  return apiPost(`/user/${userId}/compute-state`, {}, token);
}
