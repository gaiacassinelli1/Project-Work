/**
 * Configurazione Vite
 * Mare Calmo - Versione 2.0.0
 * Build tool per React development
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // Configurazione del server di development
  server: {
    port: 5173,
    open: true,
    strictPort: false,
    cors: true,
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },

  // Configurazione preview (serve di produzione)
  preview: {
    port: 4173,
    strictPort: false,
  },

  // Configurazione build
  build: {
    // Cartella output
    outDir: 'dist',
    
    // Pulisci cartella prima di build
    emptyOutDir: true,
    
    // Configurazione source maps
    sourcemap: false,
    minify: 'terser',
    
    // Configurazione rollup
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      
      output: {
        // Splitting dei chunk per migliore caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
        
        // Naming pattern per file generati
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|gif|svg|webp/.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          if (/mp3|wav|flac|aac/.test(ext)) {
            return `audio/[name]-[hash][extname]`;
          }
          if (ext === 'css') {
            return `css/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    
    // Target per browser compatibility
    target: 'esnext',
    
    // Reporting
    reportCompressedSize: true,
    
    // Chunk size warning (in KB)
    chunkSizeWarningLimit: 500,
    
    // CSS codegen
    cssCodeSplit: true,
  },

  // Configurazione dipendenze
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
    ],
    exclude: [],
  },

  // Configurazione resolve
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@context': path.resolve(__dirname, './src/context'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },

  // CSS configuration
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          $primary-color: #E8A88A;
          $secondary-color: #6A9ABE;
        `,
      },
    },
  },

  // Configurazione per environment
  define: {
    __DEV__: JSON.stringify(true),
    __VERSION__: JSON.stringify('2.0.0'),
    __API_URL__: JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3001/api'),
  },

});