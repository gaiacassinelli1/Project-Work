/**
 * Type Definitions per Mare Calmo
 * Definizioni TypeScript per tutto l'app
 */

// ──────────────────────────────────────────────
// Auth Types
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  user_id: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  locale?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ──────────────────────────────────────────────
// Auth Context Types
// ──────────────────────────────────────────────

export interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (
    email: string,
    password: string,
    locale?: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  refreshAccessToken: (refreshToken: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
}

export interface UserResponse {
  id: string;
  email: string;
  locale: string;
  onboarding_completed: boolean;
}

// ──────────────────────────────────────────────
// Game Types
// ──────────────────────────────────────────────

export interface Fish {
  fish_id: string;
  dimension: string;
  growth_level: number;
  visual_stage: 'small' | 'medium' | 'grown' | 'large' | 'adult';
}

export interface SeaState {
  state: string;
  score: number;
  visual_params: {
    light: number;
    wave_speed: number;
    particles: boolean;
  };
}

export interface Event {
  id: string;
  type: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Theme Types
// ──────────────────────────────────────────────

export interface Theme {
  name: 'notte' | 'alba';
  bgPrimary: string;
  bgSecondary: string;
  bgGradientTop: string;
  bgGradientBottom: string;
  seaDeep: string;
  seaMid: string;
  seaLight: string;
  sand: string;
  palm: string;
  rock: string;
  accentSoft: string;
  accentGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  particleColor: string;
}

// ──────────────────────────────────────────────
// Component Props Types
// ──────────────────────────────────────────────

export interface AuthPageProps {
  theme: Theme;
  onAuthSuccess: () => void;
}

export interface AnalyticsPageProps {
  theme: Theme;
  onBack: () => void;
}

export interface MareCalmoProps {
  userId?: string;
  token?: string;
  email?: string;
  theme?: Theme;
  onLogout?: () => void;
}
