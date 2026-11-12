import { useAuth } from "../contexts/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";

// Tableau de bord destiné aux employés.
function EmployeeDashboard() {

  // Récupérer le profil de l'employé connecté.
  const { user } = useAuth();

  return (
    <DashboardLayout roleName="Employé">

      <div className="dashboard-welcome">
        <h1>
          Bonjour <span>{user?.prenom}</span>
        </h1>

        <p>
          Accédez rapidement aux informations
          de votre organisation et consultez
          les documents autorisés.
        </p>
      </div>

    </DashboardLayout>
  );
}

export default EmployeeDashboard;
