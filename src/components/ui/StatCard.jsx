
import "./StatCard.css";

// Carte statistique réutilisable.
// icon reçoit maintenant un composant React.
function StatCard({ title, value, description, icon: Icon }) {

  return (
    <div className="stat-card">

      {/* Titre et icône de la statistique. */}
      <div className="stat-card-header">

        <span className="stat-card-title">
          {title}
        </span>

        <div className="stat-card-icon">
          {Icon && <Icon size={25} strokeWidth={2} />}
        </div>

      </div>

      {/* Valeur principale de la statistique. */}
      <div className="stat-card-value">
        {value}
      </div>

      <p className="stat-card-description">
        {description}
      </p>

    </div>
  );
}

export default StatCard;
