/**
 * 🌊 Mare Calmo App — Main Entry Point
 * 
 * Questo componente:
 * - Carica il tema (notte/alba)
 * - Verifica la connessione API
 * - Mostra AuthPage o MareCalmo a seconda dello stato
 */
import { useState, useEffect } from 'react';
import { AuthProvider, AuthContext } from './auth-context';
import { AuthPage } from './auth-page';
import { mareCalmo } from './mare-calmo';
import { logAPIConfig } from './api-config';
import './App.css';

// Theme definitions
const THEMES = {
  night: {
    bgGradientTop: '#0F1C2E',
    bgGradientBottom: '#1F3A5F',
    cardBg: '#1A2F46',
    cardBorder: '#2E5C76',
    cardShadow: '0 8px 32px rgba(46, 92, 118, 0.2)',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0D0E0',
    textMuted: '#7A9FB5',
    accentColor: '#E38B73',
    seaColor: '#2E5C76',
  },
  dawn: {
    bgGradientTop: '#F7F5F2',
    bgGradientBottom: '#E8DED4',
    cardBg: '#FFFFFF',
    cardBorder: '#D4C5BA',
    cardShadow: '0 8px 32px rgba(46, 92, 118, 0.1)',
    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textMuted: '#8A8A8A',
    accentColor: '#E38B73',
    seaColor: '#6FA8A6',
  },
};

function AppContent() {
  const auth = useContext(AuthContext);
  const [theme, setTheme] = useState(THEMES.night);
  const [debugMode, setDebugMode] = useState(false);

  // Log API config on mount
  useEffect(() => {
    logAPIConfig();
  }, []);

  // Handle auth state changes
  if (auth.loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.bgGradientBottom} 100%)`,
        fontFamily: "'Century Gothic', sans-serif",
      }}>
        <div style={{ textAlign: 'center', color: theme.textPrimary }}>
          <h1>🌊 Mare Calmo</h1>
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = !!auth.token;

  return (
    <div>
      {!isAuthenticated ? (
        <AuthPage theme={theme} onAuthSuccess={() => {}} />
      ) : (
        mareCalmo({
          userId: auth.user?.user_id,
          token: auth.token,
          email: auth.user?.email,
          theme,
          onLogout: auth.logout,
        })
      )}

      {/* Debug toggle (hidden by default) */}
      <div
        onClick={() => setDebugMode(!debugMode)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: theme.accentColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          opacity: debugMode ? 1 : 0.3,
          transition: 'opacity 0.3s',
          userSelect: 'none',
          zIndex: 9999,
        }}
        title="Debug mode"
      >
        🔧
      </div>

      {debugMode && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          right: '20px',
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          color: theme.textPrimary,
          maxWidth: '250px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 9998,
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Debug Info</div>
          <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
          <div>Email: {auth.user?.email || 'N/A'}</div>
          <div>Token: {auth.token ? '✅' : '❌'}</div>
          <hr style={{ margin: '8px 0', borderColor: theme.cardBorder }} />
          <button
            onClick={() => {
              console.clear();
              fetch('http://localhost:8000')
                .then(r => r.json())
                .then(d => console.log('✅ Backend:', d))
                .catch(e => console.error('❌ Backend:', e.message));
            }}
            style={{
              background: theme.accentColor,
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              width: '100%',
            }}
          >
            Test Backend
          </button>
        </div>
      )}
    </div>
  );
}

export function App() {
  const { useContext } = require('react');
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;