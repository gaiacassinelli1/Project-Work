// ========== CENTRALIZED TYPE DEFINITIONS ==========
// 
// Import questo file ovunque hai bisogno di types:
// import type { Theme, CheckInData, FishData } from "./types";
//

// ========== THEME TYPES ==========

export interface Theme {
  name: string;
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

export type ThemeName = "notte" | "alba";

// ========== GAME STATE TYPES ==========

export interface CheckInData {
  mood: number;        // 1-5
  anxiety: number;     // 1-5
  energy: number;      // 1-3
  note: string;
  timestamp: number;
}

export interface FishData {
  dimension: string;   // "studio" | "lavoro" | "benessere"
  growth: number;      // 0-1
}

export interface FishVisual extends FishData {
  i: number;
  color: string;
  accent: string;
  size: number;
  variant: number;
  stage: string;
}

export interface SeaInfo {
  label: string;
  light: number;
  waveSpeed: number;
  particles: boolean;
}

// ========== PAGE TYPES ==========

export type PageType = "onboarding" | "sea" | "island" | "support" | "progress" | "analytics";

// ========== BUBBLE ANIMATION TYPES ==========

export interface Bubble {
  id: string;
  cx: number;
  delay: number;
  dur: number;
  r: number;
}

// ========== COPING STRATEGY TYPES ==========

export interface CopingStrategy {
  trigger: "high_anxiety" | "low_energy" | "neutral";
  title: string;
  description: string;
  source: string;
}

// ========== AUTH TYPES ==========

export interface User {
  email: string;
  uid: string;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
}

// ========== API REQUEST/RESPONSE TYPES ==========

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface AuthResponse {
  token: string;
  user: User;
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

export interface CheckInResponse extends CheckInData {
  id: string;
  userId: string;
}

export interface GameStateResponse {
  seaState: number;
  fishData: FishData[];
  checkInCount: number;
}

// ========== COMPONENT PROPS TYPES ==========

export interface OnboardingPageProps {
  theme: Theme;
  onComplete: () => void;
}

export interface SeaPageProps {
  theme: Theme;
  checkIns: CheckInData[];
  fishData: FishData[];
  seaState: number;
  setSeaState: (value: number) => void;
  setCheckIns: (checkIns: CheckInData[]) => void;
  setFishData: (fish: FishData[]) => void;
  setPage: (page: PageType) => void;
  onOpenAnalytics: () => void;
}

export interface IslandPageProps {
  theme: Theme;
  seaState: number;
  setSeaState: (value: number) => void;
  checkIns: CheckInData[];
  setCheckIns: (checkIns: CheckInData[]) => void;
  fishData: FishData[];
  setFishData: (fish: FishData[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export interface SupportPageProps {
  theme: Theme;
  checkIns: CheckInData[];
  onBack: () => void;
}

export interface ProgressPageProps {
  theme: Theme;
  checkIns: CheckInData[];
  fishData: FishData[];
  seaState: number;
  onBack: () => void;
}

export interface AnalyticsPageProps {
  theme: Theme;
  onBack: () => void;
}

// ========== SVG COMPONENT TYPES ==========

export interface FishBodyProps {
  color: string;
  accent: string;
  variant: number;
  id: string;
}

export interface BubblesProps {
  count: number;
  theme: Theme;
}

export interface IslandSVGProps {
  theme: Theme;
  lanternGlow: number;
  dayCount: number;
}

// ========== UTILITY TYPES ==========

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  [key: string]: unknown;
}

// ========== CONSTANTS & ENUMS ==========

export const MOOD_RANGE = {
  MIN: 1,
  MAX: 5,
} as const;

export const ANXIETY_RANGE = {
  MIN: 1,
  MAX: 5,
} as const;

export const ENERGY_RANGE = {
  MIN: 1,
  MAX: 3,
} as const;

export const SEA_STATE_RANGE = {
  MIN: 0,
  MAX: 1,
} as const;

export const FISH_GROWTH_RANGE = {
  MIN: 0,
  MAX: 1,
} as const;

// ========== TYPE GUARDS ==========

export function isValidCheckInData(data: unknown): data is CheckInData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as CheckInData).mood === "number" &&
    typeof (data as CheckInData).anxiety === "number" &&
    typeof (data as CheckInData).energy === "number" &&
    typeof (data as CheckInData).note === "string" &&
    typeof (data as CheckInData).timestamp === "number"
  );
}

export function isValidUser(data: unknown): data is User {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as User).email === "string" &&
    typeof (data as User).uid === "string"
  );
}

export function isValidFishData(data: unknown): data is FishData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as FishData).dimension === "string" &&
    typeof (data as FishData).growth === "number"
  );
}

export function isApiResponse<T>(data: unknown): data is ApiResponse<T> {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as ApiResponse).success === "boolean" &&
    typeof (data as ApiResponse).status === "number"
  );
}

export function isApiError<T>(response: ApiResponse<T>): boolean {
  return !response.success;
}