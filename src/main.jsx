
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";

import "./index.css";

// Le fournisseur d'authentification entoure l'application.
// Tous les composants enfants peuvent utiliser useAuth().

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
