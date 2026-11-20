
/*
  Service API des collections DocuMind.

  Gestion de la liste, de la création, de la modification
  et de l'activation ou désactivation des collections.
*/

const API_URL = "http://localhost:8000";

// Envoyer une requête authentifiée et traiter les erreurs FastAPI.
async function requeteCollection(token, chemin, options = {}) {
  const response = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((erreur) => erreur.msg).join(", ")
          : `Erreur HTTP ${response.status}`
    );
  }

  return data;
}

// Lister les collections accessibles à l'utilisateur.
export function listerCollections(token) {
  return requeteCollection(token, "/collections/");
}

// Créer une collection avec ses informations obligatoires.
export function creerCollection(token, donnees) {
  return requeteCollection(token, "/collections/", {
    method: "POST",
    body: JSON.stringify(donnees)
  });
}

// Modifier les informations d'une collection existante.
export function modifierCollection(token, idCollection, donnees) {
  return requeteCollection(
    token,
    `/collections/${idCollection}`,
    {
      method: "PATCH",
      body: JSON.stringify(donnees)
    }
  );
}

// Activer ou désactiver une collection.
// FastAPI attend est_active comme paramètre de requête.
export function changerStatutCollection(
  token,
  idCollection,
  estActive
) {
  const statut = estActive ? "true" : "false";

  return requeteCollection(
    token,
    `/collections/${idCollection}/status?est_active=${statut}`,
    {
      method: "PATCH"
    }
  );
}
