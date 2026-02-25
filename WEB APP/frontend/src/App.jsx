import { useContext } from 'react'
import MareCalmo from './mare-calmo'
import { AuthPage } from './auth-page'
import { AuthContext } from './auth-context'
import './App.css'

function App() {
  const auth = useContext(AuthContext)

  // Loading state
  if (auth.loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#1A2E3E',
        fontSize: 18,
        color: '#F5F7FF',
        fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
      }}>
        ⏳ Caricamento...
      </div>
    )
  }

  // Se non autenticato, mostra la pagina di login
  if (!auth.token) {
    return <AuthPage theme={themes.notte} onAuthSuccess={() => {}} />
  }

  // Se autenticato, mostra l'app principale
  return <MareCalmo />
}

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
}

export default App
