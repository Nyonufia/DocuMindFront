
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import EditorDashboard from "./pages/EditorDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

import DashboardLayout from "./components/layout/DashboardLayout";
import { useAuth } from "./contexts/useAuth";

import RechercheDocumentaire from "./pages/RechercheDocumentaire";
import DocumentsIndexation from "./pages/DocumentsIndexation";
import UtilisateursAcces from "./pages/UtilisateursAcces";
import MesFeedbacks from "./pages/MesFeedbacks";

// Page provisoire pour les fonctionnalités à développer.
function PageEnConstruction({ titre }) {
  return (
    <div>
      <h1>{titre}</h1>
      <p>Cette fonctionnalité sera bientôt disponible.</p>
    </div>
  );
}

// Sélectionner le tableau de bord selon le rôle de l'utilisateur.
function TableauDeBord() {
  const { user } = useAuth();

  if (user?.id_role === 3) return <AdminDashboard />;
  if (user?.id_role === 2) return <EditorDashboard />;
  if (user?.id_role === 1) return <EmployeeDashboard />;

  return <p>Aucun tableau de bord associé à ce rôle.</p>;
}

// Protéger les pages selon l'authentification et les rôles.
function PageProtegee({ children, roles }) {
  const {
    user,
    isAuthenticated,
    authLoading
  } = useAuth();

  // Attendre la vérification de la session.
  if (authLoading) {
    return <p>Vérification de la session...</p>;
  }

  // Rediriger uniquement si la session est absente ou invalide.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les autorisations du rôle.
  if (roles && !roles.includes(user?.id_role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Afficher le layout commun avec la navigation latérale.
// Les tableaux de bord conservent leur propre présentation.
function PageAvecLayout({ titre, children }) {
  const { user } = useAuth();

  const nomsRoles = {
    1: "Employé",
    2: "Éditeur",
    3: "Administrateur"
  };

  return (
    <DashboardLayout roleName={nomsRoles[user?.id_role]}>
      {children || <PageEnConstruction titre={titre} />}
    </DashboardLayout>
  );
}

// Définir les routes principales de DocuMind.
function App() {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return <p>Vérification de la session...</p>;
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* Connexion */}
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        {/* Tableau de bord selon le rôle */}
        <Route
          path="/dashboard"
          element={
            <PageProtegee>
              <TableauDeBord />
            </PageProtegee>
          }
        />

        {/* Recherche documentaire */}
        <Route
          path="/recherche"
          element={
            <PageProtegee>
              <PageAvecLayout titre="Recherche documentaire">
                <RechercheDocumentaire />
              </PageAvecLayout>
            </PageProtegee>
          }
        />

        {/*
      Documents :
      - Administrateur : gestion des documents autorisés
      - Éditeur : gestion des documents
      - Employé : consultation et téléchargement uniquement

      Les autorisations des opérations restent
      contrôlées par le backend FastAPI.
    */}
        <Route
          path="/documents"
          element={
            <PageProtegee roles={[1, 2, 3]}>
              <PageAvecLayout titre="Documents">
                <DocumentsIndexation />
              </PageAvecLayout>
            </PageProtegee>
          }
        />

        <Route
          path="/mes-feedbacks"
          element={
            <PageProtegee roles={[1, 2, 3]}>
              <PageAvecLayout>
                <MesFeedbacks />
              </PageAvecLayout>
            </PageProtegee>
          }
        />

        {/* Utilisateurs et accès : Administrateur */}
        <Route
          path="/utilisateurs"
          element={
            <PageProtegee roles={[3]}>
              <PageAvecLayout titre="Utilisateurs et accès">
                <UtilisateursAcces />
              </PageAvecLayout>
            </PageProtegee>
          }
        />

        {/* Qualité et audit : Administrateur */}
        <Route
          path="/qualite"
          element={
            <PageProtegee roles={[3]}>
              <PageAvecLayout titre="Qualité et audit" />
            </PageProtegee>
          }
        />

        {/* Redirection des routes inconnues */}
        <Route
          path="*"
          element={
            <Navigate
              to={isAuthenticated ? "/dashboard" : "/login"}
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
