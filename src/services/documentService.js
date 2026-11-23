
/*
  Service documentaire DocuMind.

  Toutes les routes correspondent à celles définies
  dans app/routers/documents.py du backend FastAPI.
*/

const API_URL = "http://localhost:8000";

// Construire les en-têtes d'authentification.
function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

// Traiter les réponses FastAPI et afficher leurs erreurs.
async function traiterReponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;

    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((erreur) => erreur.msg).join(", ")
        : `Erreur HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}

// Lister les documents accessibles.
export async function listerDocuments(token) {
  const response = await fetch(`${API_URL}/documents`, {
    headers: authHeaders(token)
  });

  return traiterReponse(response);
}

// Récupérer les détails, le statut et la dernière version.
export async function obtenirDocument(token, idDocument) {
  const response = await fetch(
    `${API_URL}/documents/${idDocument}`,
    {
      headers: authHeaders(token)
    }
  );

  return traiterReponse(response);
}

// Importer un document dans une collection.
export async function importerDocument(token, fichier, idCollection) {
  const formData = new FormData();

  formData.append("fichier", fichier);
  formData.append("id_collection", String(idCollection));

  const response = await fetch(`${API_URL}/documents/upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData
  });

  return traiterReponse(response);
}

// Indexer la dernière version d'un document.
export async function indexerDocument(token, idDocument) {
  const response = await fetch(
    `${API_URL}/documents/${idDocument}/indexer`,
    {
      method: "POST",
      headers: authHeaders(token)
    }
  );

  return traiterReponse(response);
}

// Ajouter une nouvelle version du même format.
export async function ajouterVersion(
  token,
  idDocument,
  fichier
) {
  const formData = new FormData();
  formData.append("fichier", fichier);

  const response = await fetch(
    `${API_URL}/documents/${idDocument}/versions`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: formData
    }
  );

  return traiterReponse(response);
}

// Supprimer logiquement un document.
export async function supprimerDocument(token, idDocument) {
  const response = await fetch(
    `${API_URL}/documents/${idDocument}`,
    {
      method: "DELETE",
      headers: authHeaders(token)
    }
  );

  return traiterReponse(response);
}

// Restaurer un document supprimé.
export async function restaurerDocument(token, idDocument) {
  const response = await fetch(
    `${API_URL}/documents/${idDocument}/restaurer`,
    {
      method: "PATCH",
      headers: authHeaders(token)
    }
  );

  return traiterReponse(response);
}


/*
  Enregistrer la consultation réelle d'un document.

  Cette fonction est appelée lorsqu'un utilisateur
  ouvre volontairement un document.

  Le backend vérifie les autorisations et enregistre
  la consultation dans le journal d'audit.
*/
export async function enregistrerConsultation(token, idDocument) {
  const response = await fetch(
    `${API_URL}/documents/${idDocument}/consulter`,
    {
      method: "POST",
      headers: authHeaders(token)
    }
  );

  return traiterReponse(response);
}

/*
  Récupérer les derniers documents consultés
  par l'utilisateur actuellement connecté.

  Le backend retourne uniquement les documents
  toujours accessibles à cet utilisateur.
*/
export async function obtenirDocumentsConsultes(token, limite = 3) {
  const response = await fetch(
    `${API_URL}/documents/consultations/recentes?limite=${limite}`,
    {
      method: "GET",
      headers: authHeaders(token)
    }
  );

  return traiterReponse(response);
}
