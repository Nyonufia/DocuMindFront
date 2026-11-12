import { useState } from "react";
import { AuthContext } from "./AuthContextDefinition";
import {
  loginUser,
  getCurrentUser,
  changePassword
} from "../services/authService";

// Fournir les informations de connexion à l'application.
export function AuthProvider({ children }) {

  // Informations de session conservées en mémoire.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Indiquer si un changement de mot de passe est obligatoire.
  const [mustChangePassword, setMustChangePassword] =
    useState(false);

  // Authentifier l'utilisateur auprès de FastAPI.
  async function login(username, password) {

    const result = await loginUser(username, password);

    const profile = await getCurrentUser(
      result.access_token
    );

    // Vérifier si le backend exige un nouveau mot de passe.
    const passwordChangeRequired =
      Boolean(profile.doit_changer_password);

    setToken(result.access_token);
    setUser(profile);
    setMustChangePassword(passwordChangeRequired);

    return {
      ...result,
      profile
    };
  }

  // Modifier le mot de passe et renouveler la session.
  async function completePasswordChange(
    ancienPassword,
    nouveauPassword,
    confirmationPassword
  ) {

    if (!token || !user || !mustChangePassword) {
      throw new Error(
        "Aucun changement de mot de passe en attente."
      );
    }

    // Vérifier les deux saisies avant l'appel au backend.
    if (nouveauPassword !== confirmationPassword) {
      throw new Error(
        "Les nouveaux mots de passe ne correspondent pas."
      );
    }

    // FastAPI modifie le mot de passe et invalide l'ancien JWT.
    await changePassword(
      token,
      ancienPassword,
      nouveauPassword,
      confirmationPassword
    );

    // L'ancien JWT ne doit plus être utilisé.
    setToken(null);
    setUser(null);
    setMustChangePassword(false);

    // Demander un nouveau JWT avec le nouveau mot de passe.
    const result = await loginUser(
      user.username,
      nouveauPassword
    );

    const profile = await getCurrentUser(
      result.access_token
    );

    // Vérifier que le changement obligatoire est terminé.
    if (profile.doit_changer_password) {
      throw new Error(
        "Le changement de mot de passe reste obligatoire."
      );
    }

    setToken(result.access_token);
    setUser(profile);

    return profile;
  }

  // Effacer la session lors de la déconnexion.
  function logout() {
    setUser(null);
    setToken(null);
    setMustChangePassword(false);
  }

  // Partager les données et fonctions avec React.
  const value = {
    user,
    token,
    login,
    logout,
    completePasswordChange,
    mustChangePassword,
    isAuthenticated: Boolean(
      user && token && !mustChangePassword
    )
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

