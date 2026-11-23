
import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContextDefinition";

import {
  loginUser,
  getCurrentUser,
  changePassword
} from "../services/authService";

/*
  DOCUMIND — CONTEXTE D'AUTHENTIFICATION

  Fonctionnalités :
  - Connexion à FastAPI
  - Conservation du JWT dans sessionStorage
  - Restauration de session après actualisation
  - Vérification du profil utilisateur
  - Changement obligatoire du mot de passe
  - Déconnexion sécurisée
*/

const TOKEN_KEY = "documind_access_token";

// Lire le JWT conservé pendant la session du navigateur.
function lireToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Enregistrer ou supprimer le JWT.
function enregistrerToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Le stockage peut être indisponible dans certains navigateurs.
  }
}

export function AuthProvider({ children }) {

  /*
    Initialiser l'état d'authentification.

    Un JWT éventuellement enregistré sera vérifié
    auprès du backend avant d'autoriser l'accès.
  */
  const [session, setSession] = useState(() => ({
    user: null,
    token: null,
    mustChangePassword: false,
    authLoading: true
  }));

  const {
    user,
    token,
    mustChangePassword,
    authLoading
  } = session;

  /*
    Restaurer la session lors du chargement.

    getCurrentUser vérifie le JWT auprès de FastAPI.
    Si celui-ci est invalide, la session est supprimée.
  */
  useEffect(() => {
    let active = true;

    async function restaurerSession() {
      const savedToken = lireToken();

      if (!savedToken) {
        if (active) {
          setSession({
            user: null,
            token: null,
            mustChangePassword: false,
            authLoading: false
          });
        }
        return;
      }

      try {
        const profile = await getCurrentUser(savedToken);

        if (!active) return;

        setSession({
          user: profile,
          token: savedToken,
          mustChangePassword: Boolean(
            profile.doit_changer_password
          ),
          authLoading: false
        });

      } catch {
        if (!active) return;

        enregistrerToken(null);

        setSession({
          user: null,
          token: null,
          mustChangePassword: false,
          authLoading: false
        });
      }
    }

    restaurerSession();

    return () => {
      active = false;
    };
  }, []);

  /*
    Connexion d'un utilisateur.

    Le profil est récupéré avant d'enregistrer
    la nouvelle session.
  */
  async function login(username, password) {

    const result = await loginUser(username, password);

    const profile = await getCurrentUser(
      result.access_token
    );

    enregistrerToken(result.access_token);

    setSession({
      user: profile,
      token: result.access_token,
      mustChangePassword: Boolean(
        profile.doit_changer_password
      ),
      authLoading: false
    });

    return {
      ...result,
      profile
    };
  }

  /*
    Modifier le mot de passe obligatoire.

    L'ancien JWT est invalidé par FastAPI.
    Une nouvelle authentification est effectuée
    après le changement.
  */
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

    if (nouveauPassword !== confirmationPassword) {
      throw new Error(
        "Les nouveaux mots de passe ne correspondent pas."
      );
    }

    const username = user.username;

    // Effectuer le changement dans FastAPI.
    await changePassword(
      token,
      ancienPassword,
      nouveauPassword,
      confirmationPassword
    );

    /*
      L'ancien JWT n'est plus valide.
      Supprimer immédiatement la session locale.
    */
    enregistrerToken(null);

    setSession({
      user: null,
      token: null,
      mustChangePassword: false,
      authLoading: false
    });

    // Se reconnecter avec le nouveau mot de passe.
    const result = await loginUser(
      username,
      nouveauPassword
    );

    const profile = await getCurrentUser(
      result.access_token
    );

    if (profile.doit_changer_password) {
      throw new Error(
        "Le changement de mot de passe reste obligatoire."
      );
    }

    // Enregistrer le nouveau JWT.
    enregistrerToken(result.access_token);

    setSession({
      user: profile,
      token: result.access_token,
      mustChangePassword: false,
      authLoading: false
    });

    return profile;
  }

  /*
    Déconnecter l'utilisateur.

    Supprimer le JWT enregistré et réinitialiser
    toutes les informations d'authentification.
  */
  function logout() {

    enregistrerToken(null);

    setSession({
      user: null,
      token: null,
      mustChangePassword: false,
      authLoading: false
    });
  }

  /*
    Déterminer si l'utilisateur possède
    une session authentifiée et utilisable.
  */
  const isAuthenticated = Boolean(
    user &&
    token &&
    !mustChangePassword &&
    !authLoading
  );

  /*
    Partager les informations et les fonctions
    avec les composants React.
  */
  const value = {
    user,
    token,
    login,
    logout,
    completePasswordChange,
    mustChangePassword,
    authLoading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
