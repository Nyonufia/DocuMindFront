
import Login from "./pages/Login";

import AdminDashboard from "./pages/AdminDashboard";
import EditorDashboard from "./pages/EditorDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
// Importer le Hook personnalisé pour accéder à l'utilisateur connecté.
import { useAuth } from "./contexts/useAuth";

// Sélectionner l'interface selon le rôle du compte connecté.
function App() {

  const {
    user,
    isAuthenticated,
    logout
  } = useAuth();

  // Afficher la connexion tant que l'accès est interdit.
  if (!isAuthenticated) {
    return <Login />;
  }

  // Administrateur.
  if (user.id_role === 3) {
    return <AdminDashboard />;
  }

  // Éditeur.
  if (user.id_role === 2) {
    return <EditorDashboard />;
  }

  // Employé.
  if (user.id_role === 1) {
    return <EmployeeDashboard />;
  }

  // Bloquer les rôles inconnus.
  return (
    <main style={{ padding: "40px" }}>
      <h1>Accès non configuré</h1>

      <p>
        Aucun tableau de bord n'est associé à votre rôle.
      </p>

      <button type="button" onClick={logout}>
        Se déconnecter
      </button>
    </main>
  );
}

export default App;
