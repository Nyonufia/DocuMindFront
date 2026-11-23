
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Récupérer les événements d'audit depuis FastAPI.
export async function obtenirEvenementsAudit(token) {
  if (!token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/audit-events/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    let message = "Impossible de récupérer le journal d'audit.";

    try {
      const erreur = await response.json();

      if (typeof erreur.detail === "string") {
        message = erreur.detail;
      }
    } catch {
      // Conserver le message générique.
    }

    throw new Error(message);
  }

  const data = await response.json();

  return {
    total: Number(data.total ?? 0),
    events: Array.isArray(data.events) ? data.events : [],
  };
}
