import {
  Clock3,
  UserPlus,
  FileText,
  ShieldCheck,
  KeyRound,
  Activity
} from "lucide-react";

import "./RecentActivity.css";

// Associer une icône à chaque type d'action.
// Les noms correspondent aux actions du journal d'audit.
const actionIcons = {
  USER_CREATED: UserPlus,
  DOCUMENT_UPLOADED: FileText,
  LOGIN_SUCCESS: ShieldCheck,
  PASSWORD_RESET: KeyRound
};

// Afficher les dernières actions enregistrées.
// Les événements seront récupérés depuis FastAPI.
function RecentActivity({ events = [] }) {

  return (
    <section className="recent-activity">

      {/* Titre du panneau. */}
      <div className="recent-activity-header">
        <div className="recent-activity-title">
          <Clock3 size={22} />
          <h2>Activité récente</h2>
        </div>

        <span className="recent-activity-link">
          Voir tout →
        </span>
      </div>

      {/* Afficher les événements ou un message d'attente. */}
      {events.length > 0 ? (
        <div className="recent-activity-list">

          {events.map((event) => {

            // Sélectionner l'icône correspondant à l'action.
            const EventIcon =
              actionIcons[event.action] || Activity;

            return (
              <div
                className="recent-activity-item"
                key={event.id_event}
              >
                <div className="recent-activity-icon">
                  <EventIcon size={19} />
                </div>

                <div className="recent-activity-details">
                  <strong>{event.action}</strong>
                  <p>{event.details}</p>
                </div>

                <span className="recent-activity-date">
                  {new Date(event.date_event).toLocaleString("fr-CA")}
                </span>
              </div>
            );
          })}

        </div>
      ) : (
        <div className="recent-activity-empty">
          <Activity size={32} />
          <p>Aucune activité récente à afficher.</p>
        </div>
      )}

    </section>
  );
}

export default RecentActivity;
