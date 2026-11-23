
/*
  DOCUMIND — SERVICE DE GESTION DES UTILISATEURS

  Ce service centralise les requêtes HTTP vers FastAPI.
  Toutes les opérations nécessitent un JWT administrateur.
*/

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Construire les en-têtes d'authentification.
function authHeaders(token) {
  if (!token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

/*
  Traiter les réponses du backend.

  Les erreurs FastAPI sont converties
  en messages lisibles par l'interface React.
*/
async function traiterReponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;

    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((erreur) => erreur.msg).join(", ")
          : `Erreur HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}

// Récupérer tous les comptes utilisateurs.
export async function getUsers(token) {
  const response = await fetch(`${API_URL}/users/`, {
    method: "GET",
    headers: authHeaders(token)
  });

  return traiterReponse(response);
}

// Consulter les informations d'un utilisateur.
export async function getUser(token, idUser) {
  const response = await fetch(
    `${API_URL}/users/${idUser}`,
    {
      method: "GET",
      headers: authHeaders(token)
    }
  );

  return traiterReponse(response);
}

// Créer un compte avec un mot de passe temporaire.
export async function createUser(token, userData) {
  const response = await fetch(`${API_URL}/users/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(userData)
  });

  return traiterReponse(response);
}

// Modifier les informations générales du compte.
export async function updateUser(token, idUser, userData) {
  const response = await fetch(
    `${API_URL}/users/${idUser}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(userData)
    }
  );

  return traiterReponse(response);
}

// Modifier le rôle attribué à un utilisateur.
export async function updateUserRole(token, idUser, idRole) {
  const response = await fetch(
    `${API_URL}/users/${idUser}/role`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({
        id_role: idRole
      })
    }
  );

  return traiterReponse(response);
}

// Activer ou désactiver un compte utilisateur.
export async function updateUserStatus(
  token,
  idUser,
  estActif
) {
  const response = await fetch(
    `${API_URL}/users/${idUser}/status`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({
        est_actif: estActif
      })
    }
  );

  return traiterReponse(response);
}

/*
  Réinitialiser le mot de passe d'un utilisateur.

  Le mot de passe temporaire est retourné
  une seule fois par le backend.
  Ne pas le stocker dans localStorage ou dans les logs.
*/
export async function resetUserPassword(token, idUser) {
  const response = await fetch(
    `${API_URL}/users/${idUser}/reset-password`,
    {
      method: "POST",
      headers: authHeaders(token)
    }
  );

  return traiterReponse(response);
}
