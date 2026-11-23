
import { useNavigate } from "react-router-dom";

import {
  Zap,
  UserPlus,
  MessageSquareText,
  ShieldCheck,
  ClipboardList
} from "lucide-react";

import "./QuickActions.css";

/*
  DOCUMIND — ACTIONS RAPIDES ADMINISTRATEUR

  Les actions utilisent les routes existantes
  définies dans App.jsx.

  Les autorisations restent contrôlées
  par les routes protégées et le backend.
*/
const actions = [
  {
    id: "users",
    title: "Ajouter un utilisateur",
    icon: UserPlus,
    color: "blue",
    route: "/utilisateurs?action=ajouter"
  },
  {
    id: "feedback",
    title: "Consulter les feedbacks",
    icon: MessageSquareText,
    color: "purple",
    route: "/qualite"
  },
  {
    id: "access",
    title: "Gérer les accès",
    icon: ShieldCheck,
    color: "green",
    route: "/utilisateurs"
  },
  {
    id: "audit",
    title: "Consulter les audits",
    icon: ClipboardList,
    color: "pink",
    route: "/qualite"
  }
];

// Afficher les actions rapides du tableau de bord.
function QuickActions() {

  // Permet de naviguer sans recharger l'application.
  const navigate = useNavigate();

  return (
    <section className="quick-actions">

      {/* En-tête de la section. */}
      <div className="quick-actions-header">
        <Zap size={22} />
        <h2>Actions rapides</h2>
      </div>

      {/* Générer les quatre boutons d'action. */}
      <div className="quick-actions-grid">

        {actions.map((action) => {

          const Icon = action.icon;

          return (
            <button
              key={action.id}
              type="button"
              className={`quick-action quick-action--${action.color}`}
              onClick={() => navigate(action.route)}
            >
              <Icon size={26} strokeWidth={2} />
              <span>{action.title}</span>
            </button>
          );
        })}

      </div>

    </section>
  );
}

export default QuickActions;
