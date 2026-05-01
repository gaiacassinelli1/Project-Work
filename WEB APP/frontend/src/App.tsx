import { useContext, type ReactNode } from 'react'
import MareCalmo from './mare-calmo'
import { AuthPage } from './pages/auth-page'
import { AuthContext, type AuthContextType } from './context/auth-context'
import 'App.css'
import type { Theme } from './types'

const themes: Record<'notte' | 'alba', Theme> = {
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
}

function App(): ReactNode {
  const auth = useContext(AuthContext) as AuthContextType | null

  // Loading state
  if (!auth || auth.loading) {
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
        Caricamento...
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

export default App
