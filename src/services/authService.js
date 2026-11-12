/*
  Service d'authentification DocuMind.

  Ce fichier centralise les requêtes HTTP envoyées
  à notre backend FastAPI.
*/

const API_URL = "http://localhost:8000";

// Envoyer les identifiants à FastAPI.
export async function loginUser(username, password) {

  // OAuth2PasswordRequestForm attend des données
  // de formulaire plutôt qu'un objet JSON.
  const formData = new URLSearchParams();

  formData.append("username", username);
  formData.append("password", password);

  // fetch() envoie une requête HTTP au backend.
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });

  // Convertir la réponse JSON en objet JavaScript.
  const data = await response.json();

  // Si FastAPI refuse la connexion, signaler l'erreur.
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Connexion impossible."
    );
  }

  return data;
}


/*
  Récupérer le profil de l'utilisateur connecté.

  Le backend utilise le jeton JWT pour identifier
  l'utilisateur et vérifier que son compte est actif.
*/

export async function getCurrentUser(token) {

  // Envoyer le JWT dans l'en-tête Authorization.
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Convertir la réponse du backend en objet JavaScript.
  const data = await response.json();

  // Signaler une erreur si le jeton est invalide ou expiré.
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Impossible de récupérer le profil."
    );
  }

  return data;
}

/*
  Modifier le mot de passe obligatoire d'un utilisateur.

  Cette fonction transmet les informations à FastAPI.
  Le backend vérifie l'ancien mot de passe et enregistre
  le nouveau uniquement si les conditions sont respectées.
*/

export async function changePassword(
  token,
  ancienPassword,
  nouveauPassword,
  confirmationPassword
) {

  const response = await fetch(
    `${API_URL}/auth/change-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ancien_password: ancienPassword,
        nouveau_password: nouveauPassword,
        confirmation_password: confirmationPassword
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Impossible de modifier le mot de passe."
    );
  }

  return data;
}
