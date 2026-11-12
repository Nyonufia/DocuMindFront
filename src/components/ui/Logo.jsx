
import "./Logo.css";

// Importer l'image officielle du logo DocuMind.
import logoDocumind from "../../assets/logo-documind.png";

// Composant réutilisable pour afficher le logo.
function Logo() {
  return (
    <div className="documind-logo">
      <img
        src={logoDocumind}
        alt="Logo DocuMind"
        className="documind-logo-image"
      />
    </div>
  );
}

export default Logo;
