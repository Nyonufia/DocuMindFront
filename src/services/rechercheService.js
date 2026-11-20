/*
  Service de recherche documentaire DocuMind.

  Centralise les appels au backend FastAPI :
  - Questions et réponses RAG
  - Historique des recherches
  - Consultation des anciennes réponses
  - Évaluation des réponses
*/

const API_URL = "http://localhost:8000";

// Envoyer une requête authentifiée à FastAPI.
async function requeteAPI(chemin, token, options = {}) {
  if (!token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  const response = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json().catch(() => ({}));

  // Convertir les erreurs FastAPI en messages lisibles.
  if (!response.ok) {
    const detail = data.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : response.status === 403
          ? "Vous n'avez pas accès à cette ressource."
          : "Une erreur est survenue."
    );
  }

  return data;
}

// Poser une question à l'assistant RAG.
export function poserQuestion(token, question) {
  return requeteAPI("/recherche/question", token, {
    method: "POST",
    body: JSON.stringify({ question })
  });
}

// Récupérer les dernières recherches de l'utilisateur.
export function obtenirHistorique(token, limite = 20) {
  return requeteAPI(
    `/recherche/historique?limite=${limite}`,
    token
  );
}

// Consulter une question et sa réponse enregistrées.
export function obtenirDetailHistorique(token, idQuery) {
  return requeteAPI(
    `/recherche/historique/${idQuery}`,
    token
  );
}

// Évaluer une réponse RAG.
export function evaluerReponse(
  token,
  idAnswer,
  estUtile,
  commentaire = null
) {
  return requeteAPI("/feedback", token, {
    method: "POST",
    body: JSON.stringify({
      id_answer: idAnswer,
      est_utile: estUtile,
      commentaire
    })
  });
}

/*
  Télécharger le contenu binaire d'un document autorisé.

  Le JWT est transmis à FastAPI pour vérifier
  les permissions avant de récupérer le fichier.
*/
export async function recupererDocument(token, idDocument) {
  if (!token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  const response = await fetch(
    `http://localhost:8000/documents/${idDocument}/telecharger`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Impossible de consulter ce document."
    );
  }

  return response.blob();
}

/*
  Récupérer les informations d'un document
  depuis le backend FastAPI.

  Cette route vérifie les autorisations de
  l'utilisateur avant de retourner les métadonnées.
*/
export async function obtenirInformationsDocument(
  token,
  idDocument
) {
  const response = await fetch(
    `http://localhost:8000/documents/${idDocument}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Impossible de récupérer les informations du document."
    );
  }

  return data;
}
