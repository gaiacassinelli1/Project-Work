import { FC } from "react";

interface Theme {
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

interface AnalyticsPageProps {
  theme: Theme;
  onBack: () => void;
}

export const AnalyticsPage: FC<AnalyticsPageProps> = ({ theme, onBack }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.bgPrimary} 100%)`,
        padding: 24,
        transition: "all 0.8s ease",
      }}
    >
      <button
        onClick={onBack}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          background: "none",
          border: "none",
          color: theme.textSecondary,
          fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
          fontSize: 14,
          cursor: "pointer",
          zIndex: 20,
        }}
      >
        ← Torna al mare
      </button>

      <div style={{ textAlign: "center", marginTop: 60 }}>
        <h1
          style={{
            fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
            fontSize: 32,
            fontWeight: 600,
            color: theme.textPrimary,
            marginBottom: 20,
          }}
        >
          Analisi Dettagliata
        </h1>

        <div
          style={{
            maxWidth: 600,
            background: theme.cardBg,
            borderRadius: 24,
            padding: 32,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.cardShadow,
          }}
        >
          <p
            style={{
              fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
              fontSize: 16,
              color: theme.textSecondary,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Sezione analisi in fase di sviluppo. I dati raccolti durante i check-in verranno
            analizzati e presentati qui con grafici dettagliati e metriche approfondite.
          </p>

          <div
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 16,
              background: theme.bgSecondary,
              borderLeft: `4px solid ${theme.accentSoft}`,
            }}
          >
            <p
              style={{
                fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                fontSize: 13,
                color: theme.textMuted,
                margin: 0,
              }}
            >
              Tip: Continua con i check-in regolari per accumulare dati significativi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
