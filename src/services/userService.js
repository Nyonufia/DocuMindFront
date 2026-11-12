/*
  Service de gestion des utilisateurs DocuMind.

  Ce fichier regroupe les requêtes HTTP concernant
  les utilisateurs de l'application.
*/

const API_URL = "http://127.0.0.1:8000";

// Récupérer les utilisateurs depuis FastAPI.
// Le JWT est nécessaire car cette route est réservée
// aux administrateurs.
export async function getUsers(token) {

  const response = await fetch(`${API_URL}/users/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Convertir la réponse JSON en objet JavaScript.
  const data = await response.json();

  // Signaler les erreurs de l'API.
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Impossible de récupérer les utilisateurs."
    );
  }

  return data;
}
