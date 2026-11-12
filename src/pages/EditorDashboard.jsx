
import { useAuth } from "../contexts/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";

// Tableau de bord destiné aux éditeurs.
function EditorDashboard() {

  // Récupérer le profil de l'éditeur connecté.
  const { user } = useAuth();

  return (
    <DashboardLayout roleName="Éditeur">

      <div className="dashboard-welcome">
        <h1>
          Bonjour <span>{user?.prenom}</span>
        </h1>

        <p>
          Gérez le cycle de vie des documents,
          suivez leur indexation et assurez
          la qualité du corpus documentaire.
        </p>
      </div>

    </DashboardLayout>
  );
}

export default EditorDashboard;
