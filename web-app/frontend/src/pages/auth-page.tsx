import React, { useState } from "react";
import type { Theme } from "../types";
import { useAuth } from "../context/auth-context";

// ========== INTERFACES ==========

interface AuthPageProps {
  theme: Theme;
  onAuthSuccess: () => void;
}

// ========== AUTH PAGE COMPONENT ==========

const AuthPage: React.FC<AuthPageProps> = ({ theme, onAuthSuccess }) => {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Email e password sono obbligatori");
        return;
      }
      if (password.length < 6) {
        setError("La password deve essere almeno 6 caratteri");
        return;
      }

      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
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
            margin: 0,
            marginBottom: "8px",
          }}
        >
        Isola di Calma
        </h1>

        <p
          style={{
            fontSize: "14px",
            color: theme.textSecondary,
            textAlign: "center",
            margin: 0,
            marginBottom: "28px",
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
            disabled={loading}
          >
            {mode === "login" ? "Registrati" : "Accedi"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;