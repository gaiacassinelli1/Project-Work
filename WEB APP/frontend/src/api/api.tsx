// ========== API TYPES ==========

export interface RequestInit {
  headers?: HeadersInit;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface AuthResponse {
  token: string;
  user: {
    email: string;
    uid: string;
    name?: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  token: string;
}

export interface UserResponse {
  email: string;
  uid: string;
  name?: string;
  createdAt?: string;
}

// ========== API CONFIG ==========

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

// ========== GENERIC API REQUEST ==========

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit & { method?: string } = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Aggiungi token Bearer se disponibile
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = (await response.json()) as T;

    if (!response.ok) {
      return {
        success: false,
        error: getErrorMessage(data),
        status: response.status,
      };
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
      status: 500,
    };
  }
}

// ========== AUTH API FUNCTIONS ==========

export async function registerUser(payload: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginRequest): Promise<ApiResponse<AuthResponse>> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<ApiResponse<UserResponse>> {
  return apiRequest<UserResponse>("/auth/me", {
    method: "GET",
  });
}

export async function refreshToken(payload: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutUser(): Promise<ApiResponse<void>> {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
  });
}

// ========== GAMEPLAY API FUNCTIONS ==========

export interface CheckInPayload {
  mood: number;
  anxiety: number;
  energy: number;
  note: string;
}

export interface CheckInResponse extends CheckInPayload {
  id: string;
  userId: string;
  timestamp: number;
}

export async function submitCheckIn(payload: CheckInPayload): Promise<ApiResponse<CheckInResponse>> {
  return apiRequest<CheckInResponse>("/gameplay/checkin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCheckIns(): Promise<ApiResponse<CheckInResponse[]>> {
  return apiRequest<CheckInResponse[]>("/gameplay/checkins", {
    method: "GET",
  });
}

export interface GameStateResponse {
  seaState: number;
  fishData: Array<{
    dimension: string;
    growth: number;
  }>;
  checkInCount: number;
}

export async function getGameState(): Promise<ApiResponse<GameStateResponse>> {
  return apiRequest<GameStateResponse>("/gameplay/state", {
    method: "GET",
  });
}

// ========== ERROR HANDLING ==========

export function isApiError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false } {
  return !response.success;
}

export function getApiErrorMessage<T>(response: ApiResponse<T>): string {
  return response.error ?? "An unknown error occurred";
}