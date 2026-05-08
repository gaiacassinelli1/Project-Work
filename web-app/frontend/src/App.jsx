/**
 * App Component - Radice dell'applicazione
 * Mare Calmo - Versione 2.0.0
 *
 * Configura i provider globali (Theme, State) e il routing
 */

import React, { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AppStateProvider } from './context/AppStateContext';
import { useAppState } from './context/AppStateContext';
import ErrorBoundary from './components/ErrorBoundary';
import { PAGES } from './utils/constants';

/**
 * Contenuto interno dell'app
 * Usa i provider globali per accedere a tema e stato
 */
function AppContent() {
  const { state } = useAppState();

  // Placeholder per rendering pagine
  // Sarà sostituito con proper routing in fase 2
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A2E3E',
        color: '#F5F7FF',
        fontFamily: "'Century Gothic', sans-serif",
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Mare Calmo
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Supporto per l'ansia e il benessere emotivo
        </p>

        <div style={{
          padding: '2rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '2rem',
        }}>
          <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            Pagina attuale: <strong>{state.currentPage}</strong>
          </p>
          <p style={{ fontSize: '0.9rem', color: '#D8E5FF' }}>
            Fase 1: Setup Base - In Progress (35%)
          </p>
          <p style={{ fontSize: '0.9rem', color: '#A8C0E8', marginTop: '1rem' }}>
            I componenti verranno aggiunti nella Fase 2
          </p>
        </div>

        <details style={{
          padding: '1.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
        }}>
          <summary style={{
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#E8A88A',
          }}>
            Dettagli Stato App
          </summary>
          <pre style={{
            marginTop: '1rem',
            fontSize: '0.8rem',
            color: '#D8E5FF',
            textAlign: 'left',
            overflow: 'auto',
            maxHeight: '300px',
          }}>
            {JSON.stringify(state, null, 2)}
          </pre>
        </details>

        <p style={{
          fontSize: '0.85rem',
          color: '#A8C0E8',
          marginTop: '2rem',
        }}>
          Setup completato. Vedi console per ulteriori info.
        </p>
      </div>
    </div>
  );
}

/**
 * Componente App principale
 * Fornisce i provider globali e struttura dell'applicazione
 */
function App() {
  useEffect(() => {
    console.log(
      '%c✓ Mare Calmo v2.0.0 Loaded',
      'color: #E8A88A; font-size: 14px; font-weight: bold'
    );
    console.log('%cFase 1: Setup Base (35%)', 'color: #6A9ABE; font-size: 12px');
    console.log(
      '%cDocumentazione disponibile in docs/ folder',
      'color: #A8C0E8; font-size: 11px'
    );
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider initialTheme="dark">
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;