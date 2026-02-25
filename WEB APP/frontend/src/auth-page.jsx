import { useState, useContext } from "react";
import { AuthContext } from "./auth-context";

/**
 * 🔓 AuthPage — Pagina di login e registrazione
 * Design coerente con il resto dell'app (tema notte/alba, animazioni, font)
 */

const themes = {
  notte: {
    name: "notte", bgPrimary: "#1A2E3E", bgSecondary: "#2A3E52",
    bgGradientTop: "#3A5A7E", bgGradientBottom: "#1A2E3E",
    seaDeep: "#2A4A6E", seaMid: "#4A7A9E", seaLight: "#6A9ABE",
    sand: "#E8D4B8", palm: "#7AB87A", rock: "#8A9AAA",
    accentSoft: "#E8A88A", accentGlow: "#F0B8A0",
    textPrimary: "#F5F7FF", textSecondary: "#D8E5FF", textMuted: "#A8C0E8",
    cardBg: "#1F3345", cardBorder: "rgba(255,255,255,0.1)",
    cardShadow: "0 8px 24px rgba(0,0,0,0.4)", particleColor: "rgba(150,180,255,0.15)",
  },
  alba: {
    name: "alba", bgPrimary: "#F8F5F0", bgSecondary: "#EEE8E0",
    bgGradientTop: "#D8E8F0", bgGradientBottom: "#F8F5F0",
    seaDeep: "#4A7A98", seaMid: "#6A9ABB", seaLight: "#8ABBDD",
    sand: "#E0D0B8", palm: "#7AA878", rock: "#8A9AAA",
    accentSoft: "#D89070", accentGlow: "#E8A888",
    textPrimary: "#2A3040", textSecondary: "#4A5A70", textMuted: "#7A8A9A",
    cardBg: "#FFFEF8", cardBorder: "rgba(0,0,0,0.08)",
    cardShadow: "0 6px 20px rgba(0,0,0,0.06)", particleColor: "rgba(150,150,150,0.08)",
  },
};

export function AuthPage({ theme: initialTheme, onAuthSuccess }) {
  const auth = useContext(AuthContext);
  const [themeName, setThemeName] = useState("notte");
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const theme = themes[themeName];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = mode === "login"
        ? await auth.login(email, password)
        : await auth.register(email, password, "it");

      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.bgGradientBottom} 100%)`,
      padding: "20px",
      fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
      animation: "fadeIn 0.6s ease",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        button:hover { opacity: 0.8; }
      `}</style>
      {/* Pulsante tema in alto a destra */}
      <div style={{
        position: "fixed", top: 20, right: 20, zIndex: 50,
      }}>
        <button onClick={() => setThemeName(themeName === "notte" ? "alba" : "notte")} style={{
          width: 40, height: 40, borderRadius: "50%",
          border: `1px solid ${theme.cardBorder}`, background: `${theme.cardBg}cc`, backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18,
          transition: "all 0.4s ease",
        }} title={themeName === "notte" ? "Passa all'alba" : "Passa alla notte"}>
          {themeName === "notte" ? "🌅" : "🌙"}
        </button>
      </div>
      
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{
          fontSize: 42,
          fontWeight: 600,
          color: theme.textPrimary,
          margin: "0 0 12px",
        }}>
          🌊 Mare Calmo
        </h1>
        <p style={{
          fontSize: 16,
          color: theme.textMuted,
          margin: 0,
          fontStyle: "italic",
        }}>
          {mode === "login" ? "Accedi al tuo diario" : "Crea il tuo diario personale"}
        </p>
      </div>

      {/* Card con form */}
      <div style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 24,
        padding: 32,
        width: "100%",
        maxWidth: 360,
        boxShadow: theme.cardShadow,
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: theme.textSecondary,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 15,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 12,
                background: theme.bgSecondary,
                color: theme.textPrimary,
                fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                transition: "all 0.3s ease",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = theme.accentSoft}
              onBlur={(e) => e.target.style.borderColor = theme.cardBorder}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: theme.textSecondary,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 15,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 12,
                background: theme.bgSecondary,
                color: theme.textPrimary,
                fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                transition: "all 0.3s ease",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = theme.accentSoft}
              onBlur={(e) => e.target.style.borderColor = theme.cardBorder}
            />
          </div>

          {/* Messaggio di errore */}
          {error && (
            <div style={{
              padding: 12,
              borderRadius: 12,
              background: `${theme.accentSoft}20`,
              border: `1px solid ${theme.accentSoft}40`,
              color: theme.textPrimary,
              fontSize: 13,
              animation: "fadeSlideIn 0.3s ease",
            }}>
              🔓 {error}
            </div>
          )}

          {/* Button principale */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 20px",
              marginTop: 8,
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              borderRadius: 12,
              background: theme.accentSoft,
              color: theme.bgPrimary,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
              transition: "all 0.3s ease",
              opacity: loading ? 0.6 : 1,
              transform: loading ? "scale(0.98)" : "scale(1)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = theme.accentGlow)}
            onMouseLeave={(e) => e.target.style.background = theme.accentSoft}
          >
            {loading ? "⏳ Caricamento..." : (mode === "login" ? "🔑 Accedi" : "✨ Registrati")}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "24px 0",
          opacity: 0.5,
        }}>
          <div style={{ flex: 1, height: 1, background: theme.cardBorder }} />
          <span style={{ fontSize: 12, color: theme.textMuted }}>Oppure</span>
          <div style={{ flex: 1, height: 1, background: theme.cardBorder }} />
        </div>

        {/* Toggle Login/Register */}
        <button
          type="button"
          onClick={toggleMode}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 600,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 12,
            background: "transparent",
            color: theme.textSecondary,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
            transition: "all 0.3s ease",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => !loading && (e.target.style.borderColor = theme.accentSoft)}
          onMouseLeave={(e) => e.target.style.borderColor = theme.cardBorder}
        >
          {mode === "login"
            ? "Non hai un account? Registrati"
            : "Hai già un account? Accedi"}
        </button>
      </div>

      {/* Footer note */}
      <p style={{
        marginTop: 32,
        fontSize: 12,
        color: theme.textMuted,
        textAlign: "center",
        maxWidth: 360,
      }}>
        I tuoi dati sono privati e protetti.
        <br />
        Usa il tuo diario come uno spazio sicuro per te stesso.
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
