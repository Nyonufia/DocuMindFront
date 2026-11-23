
/*
  DOCUMIND — SERVICE DE GESTION DES FEEDBACKS

  Communication entre React et FastAPI.
  Les requêtes utilisent le JWT de l'utilisateur connecté.
*/

const API_URL = "http://127.0.0.1:8000";

// Fonction commune pour récupérer les données du backend.
async function getFeedbackData(endpoint, token) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    let message = "Erreur lors du chargement des feedbacks.";

    try {
      const erreur = await response.json();
      if (typeof erreur.detail === "string") {
        message = erreur.detail;
      }
    } catch {
      // Conserver le message par défaut.
    }

    throw new Error(message);
  }

  return response.json();
}

// Accessible à tous les utilisateurs authentifiés.
export function getMesFeedbacks(token) {
  return getFeedbackData("/feedback/mes-evaluations", token);
}

// Accessible uniquement à l'administrateur.
export function getTousLesFeedbacks(token) {
  return getFeedbackData("/feedback", token);
}

// Statistiques globales réservées à l'administrateur.
export function getStatistiquesFeedbacks(token) {
  return getFeedbackData("/feedback/statistiques", token);
}
