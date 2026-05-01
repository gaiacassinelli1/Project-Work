/**
 * AuthPage — Interfaccia di login e registrazione
 * 
 * Funzionalità:
 * - Toggle tra login e registrazione
 * - Validazione input lato client
 * - Gestione errori user-friendly
 * - Tema notte/alba con smooth transitions
 * - Loading states
 */

import { useState, useContext } from 'react';
import { AuthContext } from './context/auth-context';

const THEMES = {
  notte: {
    name: 'notte',
    bgGradientTop: '#3A5A7E',
    bgGradientBottom: '#1A2E3E',
    cardBg: '#1F3345',
    cardBorder: 'rgba(255,255,255,0.1)',
    cardShadow: '0 8px 24px rgba(0,0,0,0.4)',
    accentSoft: '#E8A88A',
    accentGlow: '#F0B8A0',
    textPrimary: '#F5F7FF',
    textSecondary: '#D8E5FF',
    textMuted: '#A8C0E8',
    bgSecondary: '#2A3E52',
  },
  alba: {
    name: 'alba',
    bgGradientTop: '#D8E8F0',
    bgGradientBottom: '#F8F5F0',
    cardBg: '#FFFEF8',
    cardBorder: 'rgba(0,0,0,0.08)',
    cardShadow: '0 6px 20px rgba(0,0,0,0.06)',
    accentSoft: '#D89070',
    accentGlow: '#E8A888',
    textPrimary: '#2A3040',
    textSecondary: '#4A5A70',
    textMuted: '#7A8A9A',
    bgSecondary: '#EEE8E0',
  },
};

// Validatori
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

export function AuthPage({ onAuthSuccess = () => {} }) {
  const auth = useContext(AuthContext);
  const [themeName, setThemeName] = useState('notte');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [locale, setLocale] = useState('it');
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const theme = THEMES[themeName];

  // ──────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validazioni
    if (!email.trim()) {
      setError('Email è richiesta');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email non valida');
      return;
    }

    if (!password) {
      setError('Password è richiesta');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password deve essere lunga almeno 6 caratteri');
      return;
    }

    if (mode === 'register' && password !== passwordConfirm) {
      setError('Le password non corrispondono');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (mode === 'login') {
        result = await auth.login(email, password);
      } else {
        result = await auth.register(email, password, locale);
      }

      if (result.success) {
        console.log('[AuthPage] Auth success, calling onAuthSuccess');
        onAuthSuccess();
      } else {
        setError(result.error || 'Errore sconosciuto');
      }
    } catch (err) {
      setError(err.message || 'Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setPasswordConfirm('');
  };

  // ──────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: `linear-gradient(180deg, ${theme.bgGradientTop} 0%, ${theme.bgGradientBottom} 100%)`,
        padding: '20px',
        fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
        transition: 'background 0.6s ease',
      }}
    >
      {/* Theme Toggle Button */}
      <button
        onClick={() => setThemeName(themeName === 'notte' ? 'alba' : 'notte')}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 50,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: `1px solid ${theme.cardBorder}`,
          background: `${theme.cardBg}cc`,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          transition: 'all 0.3s ease',
          color: theme.textPrimary,
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = theme.accentSoft;
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = theme.cardBorder;
          e.target.style.transform = 'scale(1)';
        }}
        title={themeName === 'notte' ? 'Passa all\'alba' : 'Passa alla notte'}
      >
        {themeName === 'notte' ? '🌅' : '🌙'}
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '42px',
            fontWeight: '600',
            color: theme.textPrimary,
            margin: '0 0 12px',
            transition: 'color 0.3s ease',
          }}
        >
          Mare Calmo
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: theme.textMuted,
            margin: '0',
            fontStyle: 'italic',
            transition: 'color 0.3s ease',
          }}
        >
          {mode === 'login'
            ? 'Accedi al tuo diario personale'
            : 'Crea il tuo spazio di calma'}
        </p>
      </div>

      {/* Auth Card */}
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '24px',
          padding: '32px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: theme.cardShadow,
          transition: 'all 0.3s ease',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: theme.textSecondary,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: '12px',
                background: theme.bgSecondary,
                color: theme.textPrimary,
                fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = theme.accentSoft)}
              onBlur={(e) => (e.target.style.borderColor = theme.cardBorder)}
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: theme.textSecondary,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '12px',
                  background: theme.bgSecondary,
                  color: theme.textPrimary,
                  fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box',
                  paddingRight: '40px',
                }}
                onFocus={(e) => (e.target.style.borderColor = theme.accentSoft)}
                onBlur={(e) => (e.target.style.borderColor = theme.cardBorder)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: theme.textMuted,
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Password Confirm (solo in registrazione) */}
          {mode === 'register' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Conferma Password
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '12px',
                  background: theme.bgSecondary,
                  color: theme.textPrimary,
                  fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = theme.accentSoft)}
                onBlur={(e) => (e.target.style.borderColor = theme.cardBorder)}
              />
            </div>
          )}

          {/* Locale Select (solo in registrazione) */}
          {mode === 'register' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Lingua
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: '12px',
                  background: theme.bgSecondary,
                  color: theme.textPrimary,
                  fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
                  boxSizing: 'border-box',
                }}
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: `${theme.accentSoft}20`,
                border: `1px solid ${theme.accentSoft}40`,
                color: theme.textPrimary,
                fontSize: '13px',
                animation: 'fadeSlideIn 0.3s ease',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 20px',
              marginTop: '8px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '12px',
              background: theme.accentSoft,
              color: '#1A2E3E',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
              transition: 'all 0.3s ease',
              opacity: loading ? 0.6 : 1,
              transform: loading ? 'scale(0.98)' : 'scale(1)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = theme.accentGlow)}
            onMouseLeave={(e) => (e.target.style.background = theme.accentSoft)}
          >
            {loading
              ? '⏳ Caricamento...'
              : mode === 'login'
              ? '🔑 Accedi'
              : '✨ Registrati'}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '24px 0',
            opacity: 0.5,
          }}
        >
          <div style={{ flex: 1, height: 1, background: theme.cardBorder }} />
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Oppure</span>
          <div style={{ flex: 1, height: 1, background: theme.cardBorder }} />
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={toggleMode}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '12px',
            background: 'transparent',
            color: theme.textSecondary,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif",
            transition: 'all 0.3s ease',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => !loading && (e.target.style.borderColor = theme.accentSoft)}
          onMouseLeave={(e) => (e.target.style.borderColor = theme.cardBorder)}
        >
          {mode === 'login'
            ? 'Non hai un account? Registrati'
            : 'Hai già un account? Accedi'}
        </button>
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: '32px',
          fontSize: '12px',
          color: theme.textMuted,
          textAlign: 'center',
          maxWidth: '380px',
          transition: 'color 0.3s ease',
        }}
      >
        I tuoi dati sono privati e protetti.
        <br />
        Usa questo diario come uno spazio sicuro per te stesso.
      </p>

      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        input:disabled,
        select:disabled,
        button:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
