
import {
  Zap,
  UserPlus,
  MessageSquareText,
  ShieldCheck,
  ClipboardList
} from "lucide-react";

import "./QuickActions.css";

// Définir les actions rapides de l'administrateur.
// Chaque action possède un titre, une icône et une couleur.
const actions = [
  {
    id: "users",
    title: "Ajouter un utilisateur",
    icon: UserPlus,
    color: "blue"
  },
  {
    id: "feedback",
    title: "Consulter les feedbacks",
    icon: MessageSquareText,
    color: "purple"
  },
  {
    id: "access",
    title: "Gérer les accès",
    icon: ShieldCheck,
    color: "green"
  },
  {
    id: "audit",
    title: "Consulter les audits",
    icon: ClipboardList,
    color: "pink"
  }
];

// Afficher les actions rapides du tableau de bord.
function QuickActions() {

  return (
    <section className="quick-actions">

      {/* En-tête de la section. */}
      <div className="quick-actions-header">
        <Zap size={22} />
        <h2>Actions rapides</h2>
      </div>

      {/* Générer les quatre cartes d'action. */}
      <div className="quick-actions-grid">

        {actions.map((action) => {

          // Récupérer le composant d'icône.
          const Icon = action.icon;

          return (
            <div
              key={action.id}
              className={`quick-action quick-action--${action.color}`}
            >
              <Icon size={26} strokeWidth={2} />

              <span>{action.title}</span>
            </div>
          );
        })}

      </div>

    </section>
  );
}

export default QuickActions;
