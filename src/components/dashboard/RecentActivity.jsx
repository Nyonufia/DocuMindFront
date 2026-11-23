import {
  Clock3, UserPlus, FileText, ShieldCheck, KeyRound, Activity, AlertCircle
} from "lucide-react";

import "./RecentActivity.css";

// Associer une icône aux actions connues du journal d'audit.
const actionIcons = {
  USER_CREATED: UserPlus,
  DOCUMENT_UPLOADED: FileText,
  LOGIN_SUCCESS: ShieldCheck,
  PASSWORD_RESET: KeyRound
};

// Afficher les cinq derniers événements transmis par le tableau de bord.
function RecentActivity({ events = [], loading = false, error = "", onViewAll }) {
  return (
    <section className="recent-activity">
      <div className="recent-activity-header">
        <div className="recent-activity-title">
          <Clock3 size={22} />
          <h2>Activité récente</h2>
        </div>
        {/* Le lien est activé lorsque la route du journal est connue. */}
        {typeof onViewAll === "function" && (
          <button type="button" className="recent-activity-link" onClick={onViewAll}>
            Voir tout →
          </button>
        )}
      </div>

      {loading ? (
        <div className="recent-activity-empty" role="status">
          <Activity size={28} />
          <p>Chargement des événements...</p>
        </div>
      ) : error ? (
        <div className="recent-activity-empty" role="alert">
          <AlertCircle size={28} />
          <p>{error}</p>
        </div>
      ) : events.length > 0 ? (
        <div className="recent-activity-list">
          {events.map((event) => {
            const EventIcon = actionIcons[event.action] || Activity;
            const date = event.date_event ? new Date(event.date_event) : null;
            return (
              <div className="recent-activity-item" key={event.id_event}>
                <div className="recent-activity-icon"><EventIcon size={19} /></div>
                <div className="recent-activity-details">
                  <strong>{event.action || "Action inconnue"}</strong>
                  <p>{event.details || "Aucun détail disponible."}</p>
                </div>
                <span className="recent-activity-date">
                  {date && !Number.isNaN(date.getTime())
                    ? date.toLocaleString("fr-CA") : "Date indisponible"}
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
