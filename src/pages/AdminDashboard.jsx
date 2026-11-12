
import { useEffect, useState } from "react";
import {
  UsersRound,
  FileText,
  Layers,
  ShieldCheck
} from "lucide-react";

import DocumentsEvolution from "../components/charts/DocumentsEvolution";
import IndexationStatus from "../components/charts/IndexationStatus";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickActions from "../components/dashboard/QuickActions";

import { useAuth } from "../contexts/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/ui/StatCard";

import { getUsers } from "../services/userService";

import "./AdminDashboard.css";

// Tableau de bord réservé aux administrateurs.
function AdminDashboard() {

  // Récupérer le profil et le JWT de l'administrateur.
  const { user, token } = useAuth();

  // Conserver le nombre d'utilisateurs actifs.
  const [activeUsers, setActiveUsers] = useState(null);

  // Conserver les messages d'erreur éventuels.
  const [error, setError] = useState("");

  // Charger les utilisateurs lorsque la page apparaît.
  useEffect(() => {

    // Cette variable évite de modifier l'état
    // après le démontage du composant.
    let cancelled = false;

    async function loadUsers() {

      try {

        // Récupérer les utilisateurs depuis FastAPI.
        const data = await getUsers(token);

        // Compter uniquement les comptes actifs.
        const count = data.users.filter(
          (account) => account.est_actif === true
        ).length;

        if (!cancelled) {
          setActiveUsers(count);
          setError("");
        }

      } catch (err) {

        if (!cancelled) {
          setError(err.message);
        }

      }
    }

    if (token) {
      loadUsers();
    }

    // Nettoyage lorsque le composant est démonté.
    return () => {
      cancelled = true;
    };

  }, [token]);

  return (
    <DashboardLayout roleName="Administrateur">

      {/* Accueil personnalisé. */}
      <div className="dashboard-welcome">
        <h1>
          Bonjour <span>{user?.prenom}</span>
        </h1>

        <p>
          Supervisez les utilisateurs, les documents
          et la sécurité de DocuMind.
        </p>
      </div>

      {/* Afficher une erreur sans bloquer toute la page. */}
      {error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      
{/* Cartes statistiques du tableau de bord administrateur. */}
<section className="admin-stats">

  <StatCard
    title="Utilisateurs actifs"
    value={activeUsers === null ? "—" : activeUsers}
    description="Comptes actuellement actifs"
    icon={UsersRound}
    variant="cyan"
  />

  <StatCard
    title="Documents"
    value="—"
    description="Documents du corpus"
    icon={FileText}
    variant="blue"
  />

  <StatCard
    title="Indexation"
    value="—"
    description="Documents indexés"
    icon={Layers}
    variant="purple"
  />

  <StatCard
    title="Événements d'audit"
    value="—"
    description="Actions enregistrées"
    icon={ShieldCheck}
    variant="pink"
  />

</section>

{/* Graphiques statistiques du tableau de bord. */}
<div className="admin-charts">

  <DocumentsEvolution data={[]} />

  <IndexationStatus
    indexed={null}
    pending={null}
    error={null}
  />

</div>

{/* Dernière section du tableau de bord administrateur. */}
<div className="admin-bottom-section">

  {/* Dernières opérations enregistrées. */}
  <RecentActivity events={[]} />

  {/* Raccourcis vers les fonctions administratives. */}
  <QuickActions />

</div>

    </DashboardLayout>
  );
}

export default AdminDashboard;
