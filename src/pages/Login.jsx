
import { useState } from "react";
import Logo from "../components/ui/Logo";
import { useAuth } from "../contexts/useAuth";
import "./Login.css";

// Page de connexion et de changement obligatoire du mot de passe.
function Login() {

  // Informations du formulaire de connexion.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Informations du nouveau mot de passe.
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Gestion des messages et du chargement.
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fonctions et informations partagées par AuthContext.
  const {
    login,
    logout,
    completePasswordChange,
    mustChangePassword
  } = useAuth();

  // Authentifier l'utilisateur avec FastAPI.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username.trim(), password);

      // Si le mot de passe est définitif, App.jsx
      // affichera automatiquement l'espace utilisateur.
      // Sinon, le formulaire de modification apparaîtra.

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Enregistrer le nouveau mot de passe obligatoire.
  async function handlePasswordChange(event) {
    event.preventDefault();
    setError("");

    // Vérifier la confirmation avant l'appel au backend.
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword === password) {
      setError(
        "Le nouveau mot de passe doit être différent de l'ancien."
      );
      return;
    }

    setLoading(true);

    try {
      // Modifier le mot de passe et renouveler le JWT.
      await completePasswordChange(
        password,
        newPassword,
        confirmPassword
      );

      // Effacer les mots de passe après la réussite.
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {

      // En cas d'échec, informer l'utilisateur.
      // Si le backend a déjà changé le mot de passe,
      // il faudra se reconnecter avec le nouveau.
      setError(err.message);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      {/* Partie gauche : identité visuelle DocuMind. */}
      <section className="login-presentation">

        <Logo />

        <div className="login-introduction">
          <p className="login-label">
            VOTRE CORPUS. VOS SOURCES.
          </p>

          <h1>
            La bonne information,
            <br />
            <span>avec sa provenance.</span>
          </h1>

          <p>
            Retrouvez les connaissances de votre organisation.
            Chaque réponse s'appuie sur des passages
            que vous pouvez vérifier.
          </p>
        </div>

        <p className="login-footer">
          DocuMind — Assistant documentaire sécurisé
        </p>

      </section>

      {/* Partie droite : formulaire adapté à la session. */}
      <section className="login-form-section">

        <div className="login-form-container">

          {!mustChangePassword ? (

            // Formulaire habituel de connexion.
            <>
              <p className="login-label">
                ACCÈS À VOTRE ESPACE
              </p>

              <h2>Se connecter</h2>

              <p className="login-subtitle">
                Accédez aux documents et fonctionnalités
                autorisés pour votre compte.
              </p>

              <form onSubmit={handleSubmit}>

                <div className="form-group">
                  <label htmlFor="username">
                    Nom d'utilisateur *
                  </label>

                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Votre identifiant"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    Mot de passe *
                  </label>

                  <div className="password-field">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      required
                    />

                    <button
                      type="button"
                      className="show-password-button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="login-submit-button"
                  disabled={loading}
                >
                  {loading
                    ? "Connexion en cours..."
                    : "Se connecter"}
                </button>

              </form>

              <p className="login-note">
                Votre compte est créé par l'administrateur.
              </p>
            </>

          ) : (

            // Formulaire affiché uniquement si FastAPI
            // exige le remplacement du mot de passe.
            <>
              <p className="login-label">
                SÉCURISATION DU COMPTE
              </p>

              <h2>Modifier le mot de passe</h2>

              <p className="password-change-notice">
                Vous devez changer votre mot de passe
                avant de continuer.
              </p>

              <form onSubmit={handlePasswordChange}>

                <div className="form-group">
                  <label htmlFor="new-password">
                    Nouveau mot de passe *
                  </label>

                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Votre nouveau mot de passe"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    minLength={6}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">
                    Confirmer le mot de passe *
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    minLength={6}
                    required
                  />
                </div>

                {error && (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="login-submit-button"
                  disabled={loading}
                >
                  {loading
                    ? "Validation en cours..."
                    : "Valider"}
                </button>

                <button
                  type="button"
                  className="cancel-password-button"
                  onClick={() => {
                    logout();
                    setPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  Annuler et revenir à la connexion
                </button>

              </form>
            </>
          )}

        </div>
      </section>
    </div>
  );
}

export default Login;
