import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./auth-context";
import { apiGet, apiPost } from "./api";

/**
 * 📊 AnalyticsPage — Insights e trend dell'utente
 * 
 * Mostra:
 * - Trend dell'ansia nel tempo
 * - Correlazioni tra dimensioni
 * - Statistiche aggregate
 * - Opzione di export/sync MongoDB
 */
export function AnalyticsPage({ theme, onBack }) {
  const auth = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiGet(`/user/${auth.user.user_id}/analytics`, auth.token);
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (auth.token && auth.user) {
      fetchAnalytics();
    }
  }, [auth.token, auth.user]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      await apiPost(`/user/${auth.user.user_id}/export-mongodb`, {}, auth.token);
      // Ricarica analytics
      const data = await apiGet(`/user/${auth.user.user_id}/analytics`, auth.token);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const downloadJSON = async () => {
    try {
      const data = await apiGet(`/user/${auth.user.user_id}/export-data`, auth.token);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mare-calmo-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.bgGradientBottom} 100%)`,
        color: theme.textPrimary,
        fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
      }}>
        ⏳ Caricamento analytics...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.bgGradientBottom} 100%)`,
      padding: "40px 20px",
      fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 36,
            fontWeight: 600,
            color: theme.textPrimary,
            margin: "0 0 8px",
          }}>
            📊 I tuoi insight
          </h1>
          <p style={{
            fontSize: 14,
            color: theme.textMuted,
            margin: 0,
          }}>
            Trend, correlazioni e statistiche personali
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: `${theme.accentSoft}20`,
            border: `1px solid ${theme.accentSoft}40`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            color: theme.textPrimary,
            fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Analytics disponibili */}
        {analytics && !analytics.error ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stats Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}>
              <div style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 16,
                padding: 16,
                boxShadow: theme.cardShadow,
              }}>
                <p style={{
                  fontSize: 12,
                  color: theme.textMuted,
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Total Check-ins
                </p>
                <p style={{
                  fontSize: 32,
                  fontWeight: 600,
                  color: theme.accentSoft,
                  margin: 0,
                }}>
                  {analytics.total_events}
                </p>
              </div>

              <div style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 16,
                padding: 16,
                boxShadow: theme.cardShadow,
              }}>
                <p style={{
                  fontSize: 12,
                  color: theme.textMuted,
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Ansia media
                </p>
                <p style={{
                  fontSize: 32,
                  fontWeight: 600,
                  color: analytics.anxiety_recent_avg > 3 ? theme.accentSoft : theme.seaLight,
                  margin: 0,
                }}>
                  {analytics.anxiety_recent_avg?.toFixed(1) || "—"}
                </p>
              </div>
            </div>

            {/* Trend */}
            <div style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 16,
              padding: 20,
              boxShadow: theme.cardShadow,
            }}>
              <p style={{
                fontSize: 12,
                color: theme.textMuted,
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Trend ansia (ultimi 7 check-in)
              </p>
              <p style={{
                fontSize: 20,
                fontWeight: 600,
                color: theme.textPrimary,
                margin: 0,
              }}>
                {analytics.anxiety_trend < 0 ? "📉 In miglioramento" : analytics.anxiety_trend > 0 ? "📈 In aumento" : "➡️ Stabile"}
              </p>
              <div style={{
                fontSize: 13,
                color: theme.textSecondary,
                marginTop: 12,
              }}>
                {analytics.anxiety_trend < 0
                  ? `Ottime notizie! La tua ansia è diminuita di ${Math.abs(analytics.anxiety_trend).toFixed(1)} punti.`
                  : analytics.anxiety_trend > 0
                  ? `Prendi un momento per respirare. L'ansia è aumentata di ${analytics.anxiety_trend.toFixed(1)} punti.`
                  : "La tua ansia rimane stabile."}
              </div>
            </div>

            {/* Correlazioni per dimensione */}
            {analytics.dimension_anxiety && Object.keys(analytics.dimension_anxiety).length > 0 && (
              <div style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 16,
                padding: 20,
                boxShadow: theme.cardShadow,
              }}>
                <p style={{
                  fontSize: 12,
                  color: theme.textMuted,
                  margin: "0 0 16px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Ansia per dimension
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {Object.entries(analytics.dimension_anxiety).map(([dim, anxiety]) => (
                    <div key={dim}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        fontSize: 13,
                      }}>
                        <span style={{ textTransform: "capitalize", color: theme.textPrimary }}>
                          {dim}
                        </span>
                        <span style={{
                          fontWeight: 600,
                          color: anxiety > 3 ? theme.accentSoft : theme.seaLight,
                        }}>
                          {anxiety.toFixed(1)}/5
                        </span>
                      </div>
                      <div style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 3,
                        background: theme.bgSecondary,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${(anxiety / 5) * 100}%`,
                          height: "100%",
                          borderRadius: 3,
                          background: anxiety > 3 ? theme.accentSoft : theme.seaLight,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Azioni */}
            <div style={{
              display: "flex",
              gap: 12,
              flexDirection: "column",
            }}>
              <button
                onClick={downloadJSON}
                style={{
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: 12,
                  background: "transparent",
                  color: theme.textSecondary,
                  cursor: "pointer",
                  fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                  transition: "all 0.3s ease",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => e.target.style.borderColor = theme.accentSoft}
                onMouseLeave={(e) => e.target.style.borderColor = theme.cardBorder}
              >
                📥 Scarica JSON
              </button>

              <button
                onClick={handleExport}
                disabled={exporting}
                style={{
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 12,
                  background: theme.accentSoft,
                  color: theme.bgPrimary,
                  cursor: exporting ? "not-allowed" : "pointer",
                  fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                  transition: "all 0.3s ease",
                  opacity: exporting ? 0.6 : 1,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => !exporting && (e.target.style.background = theme.accentGlow)}
                onMouseLeave={(e) => e.target.style.background = theme.accentSoft}
              >
                {exporting ? "⏳ Sincronizzazione..." : "☁️ Sincronizza MongoDB"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
            boxShadow: theme.cardShadow,
          }}>
            <p style={{
              fontSize: 48,
              margin: "0 0 12px",
            }}>
              📭
            </p>
            <p style={{
              fontSize: 14,
              color: theme.textSecondary,
              margin: "0 0 16px",
            }}>
              Nessun dato disponibile ancora. Effettua qualche check-in e sincronizza i dati.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                background: theme.accentSoft,
                color: theme.bgPrimary,
                border: "none",
                borderRadius: 8,
                cursor: exporting ? "not-allowed" : "pointer",
                fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                opacity: exporting ? 0.6 : 1,
              }}
            >
              {exporting ? "⏳..." : "Sincronizza ora"}
            </button>
          </div>
        )}

        {/* Back button */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 50,
              padding: "10px 20px",
              color: theme.textMuted,
              fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => e.target.style.borderColor = theme.accentSoft}
            onMouseLeave={(e) => e.target.style.borderColor = theme.cardBorder}
          >
            ← Torna indietro
          </button>
        </div>
      </div>
    </div>
  );
}
