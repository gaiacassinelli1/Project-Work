import React from "react";
import ReactDOM from "react-dom/client";
import App from "./mare-calmo.tsx";
import { AuthProvider } from "./auth-context";

// Verifica che root element esista
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found in index.html");
}

// Render dell'applicazione con Provider di autenticazione
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
