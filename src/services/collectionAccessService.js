/*
  DOCUMIND — SERVICE DE GESTION DES ACCÈS

  Ce service permet :
  - De consulter les utilisateurs associés à une collection
  - D'attribuer un utilisateur à une collection
  - De retirer un utilisateur d'une collection
  - De consulter les collections attribuées à un utilisateur

  Les autorisations sont vérifiées par FastAPI.
*/

// Adapter cette adresse si ton backend utilise un autre port.
const API_URL = "http://127.0.0.1:8000";

/*
  Envoyer une requête authentifiée à FastAPI.

  Le JWT est transmis dans l'en-tête Authorization.
*/
async function requeteAPI(chemin, token, options = {}) {
  if (!token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${chemin}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error(
      "Impossible de communiquer avec le serveur FastAPI."
    );
  }

  // Lire la réponse JSON lorsque celle-ci est disponible.
  const resultat = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = resultat?.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : `Erreur HTTP ${response.status}`
    );
  }

  return resultat;
}

/*
  Consulter les utilisateurs associés à une collection.

  GET /collections/{id_collection}/users

  Accessible à l'Administrateur et à l'Éditeur.
*/
export async function getUtilisateursCollection(
  token,
  idCollection
) {
  return requeteAPI(
    `/collections/${idCollection}/users`,
    token
  );
}

/*
  Attribuer un utilisateur existant à une collection.

  POST /collections/{id_collection}/users/{id_user}

  Réservé à l'Éditeur.
*/
export async function attribuerUtilisateurCollection(
  token,
  idCollection,
  idUser
) {
  return requeteAPI(
    `/collections/${idCollection}/users/${idUser}`,
    token,
    {
      method: "POST"
    }
  );
}

/*
  Retirer un utilisateur d'une collection.

  DELETE /collections/{id_collection}/users/{id_user}

  Réservé à l'Éditeur.
*/
export async function retirerUtilisateurCollection(
  token,
  idCollection,
  idUser
) {
  return requeteAPI(
    `/collections/${idCollection}/users/${idUser}`,
    token,
    {
      method: "DELETE"
    }
  );
}

/*
  Consulter les collections attribuées à un utilisateur.

  GET /collections/users/{id_user}

  Accessible à l'Administrateur et à l'Éditeur.
*/
export async function getCollectionsUtilisateur(
  token,
  idUser
) {
  return requeteAPI(
    `/collections/users/${idUser}`,
    token
  );
}

// Récupérer les utilisateurs actifs disponibles
// pour l'attribution aux collections documentaires.
export async function getUtilisateursDisponibles(token) {
  return requeteAPI(
    "/collections/utilisateurs-disponibles",
    token
  );
}

/*
  Compatibilité avec les noms utilisés
  dans DocumentsIndexation.jsx.
*/

export const listerUtilisateursCollection =
  getUtilisateursCollection;

export const listerUtilisateursDisponibles =
  getUtilisateursDisponibles;
