import { useEffect, useState } from "react";
import { UsersRound, FileText, Layers, ShieldCheck } from "lucide-react";

import DocumentsEvolution from "../components/charts/DocumentsEvolution";
import IndexationStatus from "../components/charts/IndexationStatus";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickActions from "../components/dashboard/QuickActions";
import { useAuth } from "../contexts/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/ui/StatCard";
import { getUsers } from "../services/userService";
import { obtenirEvenementsAudit } from "../services/auditService";
import { listerDocuments, obtenirDocument } from "../services/documentService";

import "./AdminDashboard.css";

// Construire les ajouts quotidiens des 30 derniers jours (calendrier local).
// Le graphique attend des objets { date, total }.
function preparerEvolutionDocuments(documents) {
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);

  const jours = Array.from({ length: 30 }, (_, index) => {
    const jour = new Date(aujourdHui);
    jour.setDate(jour.getDate() - (29 - index));
    const cle = `${jour.getFullYear()}-${String(jour.getMonth() + 1).padStart(2, "0")}-${String(jour.getDate()).padStart(2, "0")}`;
    return { cle, date: jour.toLocaleDateString("fr-CA", { day: "2-digit", month: "2-digit" }), total: 0 };
  });

  const parJour = new Map(jours.map((jour) => [jour.cle, jour]));

  documents.forEach((document) => {
    if (!document.date_ajout) return;
    const date = new Date(document.date_ajout);
    if (Number.isNaN(date.getTime())) return;
    const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const jour = parJour.get(cle);
    if (jour) jour.total += 1;
  });

  return jours.map(({ date, total }) => ({ date, total }));
}

// Tableau de bord Administrateur : statistiques issues des API sécurisées.
function AdminDashboard() {
  const { user, token } = useAuth();

  // Nombre de comptes utilisateurs actifs.
  const [activeUsers, setActiveUsers] = useState(null);
  const [error, setError] = useState("");

  // Journal d'audit : total et trois événements les plus récents.
  const [auditTotal, setAuditTotal] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState("");

  // Statistiques des documents accessibles à l'administrateur.
  const [totalDocuments, setTotalDocuments] = useState(null);
  const [documentsIndexes, setDocumentsIndexes] = useState(null);
  const [erreurDocuments, setErreurDocuments] = useState("");
  const [evolutionDocuments, setEvolutionDocuments] = useState([]);
  const [indexation, setIndexation] = useState({ indexed: null, pending: null, error: null });

  // Charger les utilisateurs actifs, sans mise à jour après démontage.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadUsers() {
      try {
        const data = await getUsers(token);
        const users = Array.isArray(data?.users) ? data.users : [];
        const count = users.filter((account) => account.est_actif === true).length;

        if (!cancelled) {
          setActiveUsers(count);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Impossible de charger les utilisateurs.");
        }
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Charger le total d'audit et les trois événements les plus récents.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function chargerAudit() {
      try {
        const resultat = await obtenirEvenementsAudit(token);
        if (cancelled) return;

        setAuditTotal(resultat.total);
        setAuditEvents(resultat.events.slice(0, 3));
        setAuditError("");
      } catch (err) {
        if (!cancelled) {
          setAuditError(err.message || "Impossible de charger le journal d'audit.");
        }
      } finally {
        if (!cancelled) setAuditLoading(false);
      }
    }

    chargerAudit();
    return () => {
      cancelled = true;
    };
  }, [token]);

  /*
    Charger les statistiques documentaires.
    Le backend ne retourne que les documents autorisés pour ce compte.
    On compte les versions dont le statut est exactement « indexed ».
  */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function chargerStatistiquesDocuments() {
      try {
        const resultat = await listerDocuments(token);
        const documents = Array.isArray(resultat)
          ? resultat
          : resultat?.documents;

        if (!Array.isArray(documents)) {
          throw new Error("Format de la liste des documents inattendu.");
        }

        if (cancelled) return;
        setTotalDocuments(documents.length);
        setEvolutionDocuments(preparerEvolutionDocuments(documents));

        // Chaque détail permet de connaître le statut de la dernière version.
        // Les requêtes sont regroupées pour attendre tous les résultats.
        const details = await Promise.all(
          documents.map((document) => {
            const id = document.id_document ?? document.id_doc;
            if (id == null) {
              throw new Error("Identifiant de document manquant.");
            }
            return obtenirDocument(token, id);
          })
        );

        if (cancelled) return;

        // Compter les statuts réels, sans attribuer un statut fictif.
        const compteurs = { indexed: 0, pending: 0, error: 0 };
        const statutsInconnus = new Set();

        details.forEach((document) => {
          const statut = document?.derniere_version?.statut;
          if (statut === "indexed") compteurs.indexed += 1;
          else if (statut === "pending" || statut === "processing") compteurs.pending += 1;
          else if (statut === "error") compteurs.error += 1;
          else statutsInconnus.add(statut ?? "sans statut");
        });

        setDocumentsIndexes(compteurs.indexed);

        // Si un statut n'est pas reconnu, ne pas présenter une répartition
        // incomplète comme si elle couvrait tous les documents.
        if (statutsInconnus.size > 0) {
          setIndexation({ indexed: null, pending: null, error: null });
          setErreurDocuments(
            `Statuts d'indexation à vérifier : ${[...statutsInconnus].join(", ")}.`
          );
        } else {
          setIndexation(compteurs);
          setErreurDocuments("");
        }
      } catch (err) {
        if (!cancelled) {
          setDocumentsIndexes(null);
          setIndexation({ indexed: null, pending: null, error: null });
          setErreurDocuments(
            err.message || "Impossible de charger les statistiques documentaires."
          );
        }
      }
    }

    chargerStatistiquesDocuments();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <DashboardLayout roleName="Administrateur">
      <main className="admin-dashboard">
        {/* Accueil personnalisé. */}
        <header className="admin-heading">
          <p className="admin-eyebrow">ESPACE ADMINISTRATEUR · DOCUMIND</p>
          <h1>
            Bonjour <span>{user?.prenom || "Administrateur"}</span>
          </h1>
          <p className="admin-subtitle">
            Supervisez les utilisateurs, les documents et la sécurité de DocuMind.
          </p>
        </header>

        {/* Afficher les erreurs sans masquer les autres sections. */}
        {error && <p className="admin-error" role="alert">{error}</p>}
        {erreurDocuments && (
          <p className="admin-error" role="alert">{erreurDocuments}</p>
        )}

        {/* Quatre indicateurs administratifs dynamiques. */}
        <section className="admin-stats" aria-label="Indicateurs administratifs">
          <div className="admin-stat-shell admin-stat-shell--cyan">
            <StatCard
              title="Utilisateurs actifs"
              value={activeUsers === null ? "—" : activeUsers}
              description="Comptes actuellement actifs"
              icon={UsersRound}
              variant="cyan"
            />
          </div>

          <div className="admin-stat-shell admin-stat-shell--blue">
            <StatCard
              title="Documents"
              value={totalDocuments === null ? "—" : totalDocuments}
              description="Documents accessibles"
              icon={FileText}
              variant="blue"
            />
          </div>

          <div className="admin-stat-shell admin-stat-shell--purple">
            <StatCard
              title="Indexation"
              value={documentsIndexes === null ? "—" : documentsIndexes}
              description="Documents indexés"
              icon={Layers}
              variant="purple"
            />
          </div>

          <div className="admin-stat-shell admin-stat-shell--pink">
            <StatCard
              title="Événements d'audit"
              value={auditTotal === null ? "—" : auditTotal}
              description="Actions enregistrées"
              icon={ShieldCheck}
              variant="pink"
            />
          </div>
        </section>

        {/* Graphiques alimentés par les mêmes données documentaires que les cartes. */}
        <section className="admin-charts" aria-label="Graphiques statistiques">
          <div className="admin-panel admin-chart-panel">
            <DocumentsEvolution data={evolutionDocuments} />
          </div>
          <div className="admin-panel admin-chart-panel">
            <IndexationStatus
              indexed={indexation.indexed}
              pending={indexation.pending}
              error={indexation.error}
            />
          </div>
        </section>

        {/* Les trois derniers événements d'audit et les actions rapides. */}
        <section className="admin-bottom-section" aria-label="Activité et raccourcis">
          <div className="admin-panel admin-activity-panel">
            <RecentActivity
              events={auditEvents}
              loading={auditLoading}
              error={auditError}
            />
          </div>
          <div className="admin-panel admin-actions-panel">
            <QuickActions />
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default AdminDashboard;
