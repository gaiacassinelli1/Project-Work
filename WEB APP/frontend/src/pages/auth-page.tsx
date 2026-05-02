import { useState, FC, FormEvent } from "react";
import type { Theme } from "../types";

// ========== INTERFACES ==========

interface AuthPageProps {
  theme: Theme;
  onAuthSuccess: () => void;
}

interface AuthFormData {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  token?: string;
}

// ========== THEMES ==========

const themes: Record<string, Theme> = {
  notte: {
    name: "notte",
    bgPrimary: "#1A2E3E",
    bgSecondary: "#2A3E52",
    bgGradientTop: "#3A5A7E",
    bgGradientBottom: "#1A2E3E",
    seaDeep: "#2A4A6E",
    seaMid: "#4A7A9E",
    seaLight: "#6A9ABE",
    sand: "#E8D4B8",
    palm: "#7AB87A",
    rock: "#8A9AAA",
    accentSoft: "#E8A88A",
    accentGlow: "#F0B8A0",
    textPrimary: "#F5F7FF",
    textSecondary: "#D8E5FF",
    textMuted: "#A8C0E8",
    cardBg: "#1F3345",
    cardBorder: "rgba(255,255,255,0.1)",
    cardShadow: "0 8px 24px rgba(0,0,0,0.4)",
    particleColor: "rgba(150,180,255,0.15)",
  },
  alba: {
    name: "alba",
    bgPrimary: "#F8F5F0",
    bgSecondary: "#EEE8E0",
    bgGradientTop: "#D8E8F0",
    bgGradientBottom: "#F8F5F0",
    seaDeep: "#4A7A98",
    seaMid: "#6A9ABB",
    seaLight: "#8ABBDD",
    sand: "#E0D0B8",
    palm: "#7AA878",
    rock: "#8A9AAA",
    accentSoft: "#D89070",
    accentGlow: "#E8A888",
    textPrimary: "#2A3040",
    textSecondary: "#4A5A70",
    textMuted: "#7A8A9A",
    cardBg: "#FFFEF8",
    cardBorder: "rgba(0,0,0,0.08)",
    cardShadow: "0 6px 20px rgba(0,0,0,0.06)",
    particleColor: "rgba(150,150,150,0.08)",
  },
};

// ========== AUTH PAGE COMPONENT ==========

const AuthPage: FC<AuthPageProps> = ({ theme, onAuthSuccess }): JSX.Element => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validazione base
      if (!email || !password) {
        setError("Email e password sono obbligatori");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("La password deve essere almeno 6 caratteri");
        setLoading(false);
        return;
      }

      // Simula una richiesta auth (sostituire con vera API)
      const response = await authenticateUser({
        email,
        password,
        mode,
      });

      if (response.success) {
        // Salva il token
        if (response.token) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("user", JSON.stringify({ email }));
        }
        onAuthSuccess();
      } else {
        setError(response.error || "Errore durante l'autenticazione");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Errore sconosciuto";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.bgGradientBottom} 100%)`,
        padding: "20px",
        fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        input::-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px ${theme.cardBg} inset;
          -webkit-text-fill-color: ${theme.textPrimary};
        }
        
        input::placeholder {
          color: ${theme.textMuted};
          opacity: 0.7;
        }
      `}</style>

      <div
        style={{
          background: theme.cardBg,
          borderRadius: "24px",
          padding: "40px",
          border: `1px solid ${theme.cardBorder}`,
          boxShadow: theme.cardShadow,
          maxWidth: "400px",
          width: "100%",
          animation: "fadeSlideIn 0.8s ease",
        }}
      >
        {/* HEADER */}
        <h1
          style={{
            fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
            fontSize: "28px",
            fontWeight: 600,
            color: theme.textPrimary,
            textAlign: "center",
            marginBottom: "8px",
            margin: 0,
          }}
        >
          Mare Calmo
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: theme.textSecondary,
            textAlign: "center",
            marginBottom: "28px",
            margin: "0 0 28px",
          }}
        >
          {mode === "login"
            ? "Accedi al tuo spazio di calma"
            : "Crea il tuo account personale"}
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* EMAIL INPUT */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: theme.textSecondary,
                marginBottom: "6px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e): void => setEmail(e.target.value)}
              placeholder="tuo@email.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: `1px solid ${theme.cardBorder}`,
                background: theme.bgSecondary,
                color: theme.textPrimary,
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
                outline: "none",
              }}
              onFocus={(e): void => {
                e.currentTarget.style.borderColor = theme.accentSoft;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.accentSoft}22`;
              }}
              onBlur={(e): void => {
                e.currentTarget.style.borderColor = theme.cardBorder;
                e.currentTarget.style.boxShadow = "none";
              }}
              disabled={loading}
            />
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: theme.textSecondary,
                marginBottom: "6px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e): void => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: `1px solid ${theme.cardBorder}`,
                background: theme.bgSecondary,
                color: theme.textPrimary,
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
                outline: "none",
              }}
              onFocus={(e): void => {
                e.currentTarget.style.borderColor = theme.accentSoft;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.accentSoft}22`;
              }}
              onBlur={(e): void => {
                e.currentTarget.style.borderColor = theme.cardBorder;
                e.currentTarget.style.boxShadow = "none";
              }}
              disabled={loading}
            />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#8B3A3A",
                border: "1px solid #C85A5A",
                color: "#FFB3B3",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: "12px",
              border: "none",
              background: loading ? theme.textMuted : theme.accentSoft,
              color: "#1A2E3E",
              fontWeight: 600,
              fontSize: "14px",
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.3s ease",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e): void => {
              if (!loading) {
                e.currentTarget.style.background = theme.accentGlow;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 16px ${theme.accentSoft}33`;
              }
            }}
            onMouseLeave={(e): void => {
              e.currentTarget.style.background = theme.accentSoft;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? "Caricamento..." : mode === "login" ? "Accedi" : "Registrati"}
          </button>
        </form>

        {/* MODE TOGGLE */}
        <p
          style={{
            fontSize: "13px",
            color: theme.textSecondary,
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          {mode === "login" ? "Non hai un account? " : "Hai già un account? "}
          <button
            onClick={(): void => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setEmail("");
              setPassword("");
            }}
            style={{
              background: "none",
              border: "none",
              color: theme.accentSoft,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
              fontFamily: "inherit",
              transition: "color 0.3s ease",
              textDecoration: "underline",
              padding: 0,
            }}
            onMouseEnter={(e): void => {
              e.currentTarget.style.color = theme.accentGlow;
            }}
            onMouseLeave={(e): void => {
              e.currentTarget.style.color = theme.accentSoft;
            }}
            disabled={loading}
          >
            {mode === "login" ? "Registrati" : "Accedi"}
          </button>
        </p>
      </div>
    </div>
  );
};

// ========== AUTH HELPER FUNCTION ==========

async function authenticateUser(
  data: { email: string; password: string; mode: "login" | "register" }
): Promise<AuthResponse> {
  try {
    // Simulazione di autenticazione locale
    // In produzione, chiamare il vero endpoint API

    // Validazione
    if (!data.email.includes("@")) {
      return {
        success: false,
        error: "Email non valida",
      };
    }

    if (data.password.length < 6) {
      return {
        success: false,
        error: "Password troppo corta",
      };
    }

    // Simula un delay di rete
    await new Promise((resolve): void => {
      setTimeout(resolve, 500);
    });

    // Simula successo
    const mockToken = `token-${Date.now()}`;
    return {
      success: true,
      token: mockToken,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export default AuthPage;