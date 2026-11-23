import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePlus2, FileCheck2, LoaderCircle, AlertTriangle, RefreshCw,
  FileText, UploadCloud, Search, Tags, ListChecks, ChevronLeft,
  ChevronRight, ArrowUpRight, FolderOpen, MoreHorizontal
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import { listerDocuments, obtenirDocument } from "../services/documentService";
import "../styles/EditorDashboard.css";

// Statuts explicitement reconnus. Le backend crée les versions avec "pending"
// et confirme "indexed". Les autres valeurs restent à vérifier dans indexation_service.py.
const INDEXES = new Set(["indexed"]);
const EN_COURS = new Set(["processing", "indexing"]);
const ERREURS = new Set(["failed", "error"]);
const ATTENTE = new Set(["pending"]);
const PAR_PAGE = 5;

function nomStatut(statut) {
  const valeur = String(statut ?? "").toLowerCase();
  if (INDEXES.has(valeur)) return { texte: "Indexé", classe: "indexed" };
  if (EN_COURS.has(valeur)) return { texte: "En traitement", classe: "processing" };
  if (ERREURS.has(valeur)) return { texte: "Erreur", classe: "error" };
  if (ATTENTE.has(valeur)) return { texte: "En attente", classe: "pending" };
  return { texte: "Indisponible", classe: "unknown" };
}

function dateLisible(valeur) {
  if (!valeur) return "—";
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-CA", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function EditorDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [actualisation, setActualisation] = useState(0);
  const [page, setPage] = useState(1);

  // Récupérer les documents autorisés et le statut de leur dernière version.
  // Une erreur sur un détail reste visible : elle ne devient jamais un faux statut.
  useEffect(() => {
    if (!token) return;
    let actif = true;
    async function charger() {
      setChargement(true);
      setErreur("");
      try {
        const reponse = await listerDocuments(token);
        const liste = Array.isArray(reponse) ? reponse : reponse?.documents;
        if (!Array.isArray(liste)) throw new Error("Format de liste documentaire inattendu.");
        const details = await Promise.all(liste.map(async (document) => {
          try {
            const resultat = await obtenirDocument(token, document.id_document);
            return { ...document, statutIndexation: resultat?.derniere_version?.statut ?? null };
          } catch {
            return { ...document, statutIndexation: null };
          }
        }));
        if (actif) {
          setDocuments(details);
          setPage(1);
        }
      } catch (e) {
        if (actif) {
          setErreur(e.message || "Impossible de charger les documents.");
          setDocuments([]);
        }
      } finally {
        if (actif) setChargement(false);
      }
    }
    // Déclencher la récupération asynchrone sans setState synchrone dans l'effet.
    Promise.resolve().then(() => { if (actif) charger(); });
    return () => { actif = false; };
  }, [token, actualisation]);

  // Calculer les métriques à partir des documents réellement accessibles.
  const statistiques = useMemo(() => {
    const maintenant = new Date();
    const compte = (ensemble) => documents.filter((d) =>
      ensemble.has(String(d.statutIndexation ?? "").toLowerCase())).length;
    const ajoutes = documents.filter((d) => {
      const date = new Date(d.date_ajout);
      return !Number.isNaN(date.getTime()) &&
        date.getMonth() === maintenant.getMonth() &&
        date.getFullYear() === maintenant.getFullYear();
    }).length;
    const inconnus = documents.filter((d) => {
      const statut = String(d.statutIndexation ?? "").toLowerCase();
      return !INDEXES.has(statut) && !EN_COURS.has(statut) &&
        !ERREURS.has(statut) && !ATTENTE.has(statut);
    }).length;
    return { ajoutes, indexes: compte(INDEXES), enCours: compte(EN_COURS),
      erreurs: compte(ERREURS), inconnus };
  }, [documents]);

  const documentsTries = useMemo(() => [...documents].sort((a, b) =>
    new Date(b.date_ajout).getTime() - new Date(a.date_ajout).getTime() ||
    b.id_document - a.id_document), [documents]);
  const totalPages = Math.max(1, Math.ceil(documentsTries.length / PAR_PAGE));
  const documentsPage = documentsTries.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const cartes = [
    { titre: "Documents ajoutés", valeur: statistiques.ajoutes, detail: "Ce mois-ci", Icone: FilePlus2, couleur: "blue" },
    { titre: "Documents indexés", valeur: statistiques.indexes, detail: "Dernière version indexée", Icone: FileCheck2, couleur: "green" },
    { titre: "Traitements en cours", valeur: statistiques.enCours, detail: "Indexation active", Icone: LoaderCircle, couleur: "orange" },
    { titre: "Erreurs de traitement", valeur: statistiques.erreurs, detail: "Indexation en échec", Icone: AlertTriangle, couleur: "red" }
  ];

  // Les actions redirigent vers les pages existantes, sans simuler une importation.
  // Si les routes de l'application diffèrent, adapter ces deux constantes.
  const ROUTE_DOCUMENTS = "/documents";
  const ROUTE_RECHERCHE = "/recherche";
  const actions = [
    { titre: "Importer des documents", description: "Ajouter des fichiers au corpus", Icone: UploadCloud, chemin: ROUTE_DOCUMENTS, couleur: "blue" },
    { titre: "Suivre l'indexation", description: "Voir les statuts et lancer un traitement", Icone: ListChecks, chemin: ROUTE_DOCUMENTS, couleur: "purple" },
    { titre: "Gérer les métadonnées", description: "Consulter les informations documentaires", Icone: Tags, chemin: ROUTE_DOCUMENTS, couleur: "orange" },
    { titre: "Lancer une recherche", description: "Interroger le corpus documentaire", Icone: Search, chemin: ROUTE_RECHERCHE, couleur: "green" }
  ];

  return (
    <DashboardLayout roleName="Éditeur">
      <main className="editor-dashboard">
        <header className="editor-heading">
          <div>
            <p className="editor-eyebrow">ESPACE ÉDITEUR · DOCUMIND</p>
            <h1>Bonjour <span>{user?.prenom || "cher utilisateur"}</span> <span aria-hidden="true"></span></h1>
            <p className="editor-subtitle">Gérez le cycle de vie des documents, suivez leur indexation et assurez la qualité du corpus documentaire.</p>
          </div>
          <button className="editor-refresh" type="button" onClick={() => setActualisation((n) => n + 1)} disabled={chargement || !token}>
            <RefreshCw size={17} className={chargement ? "editor-spin" : ""} /> Actualiser
          </button>
        </header>

        {erreur && <div className="editor-error-message" role="alert">{erreur}</div>}
        <section className="editor-metrics" aria-label="Indicateurs documentaires">
          {cartes.map(({ titre, valeur, detail, Icone, couleur }) => (
            <article key={titre} className={`editor-metric editor-metric--${couleur}`}>
              <div className="editor-metric-top">
                <span>{titre}</span>
                <div className="editor-metric-icon"><Icone size={22} /></div>
              </div>
              <strong>{chargement || erreur || !token ? "—" : valeur}</strong>
              <small>{detail}</small>
            </article>
          ))}
        </section>
        {!chargement && !erreur && statistiques.inconnus > 0 && (
          <p className="editor-warning" role="status">
            {statistiques.inconnus} document(s) ont un statut indisponible ou non reconnu. Les indicateurs d'indexation peuvent être incomplets.
          </p>
        )}

        <div className="editor-content-grid">
          <section className="editor-panel editor-recent" aria-labelledby="editor-recent-title">
            <div className="editor-panel-heading">
              <div>
                <h2 id="editor-recent-title">Documents récents</h2>
                <p>Derniers fichiers ajoutés à vos collections</p>
              </div>
              <span className="editor-count">{documentsTries.length} documents</span>
            </div>
            <div className="editor-table-wrap">
              <table className="editor-table">
                <thead><tr><th>Nom du document</th><th>Collection</th><th>Date d'ajout</th><th>Statut</th><th><span className="editor-sr-only">Action</span></th></tr></thead>
                <tbody>
                  {!chargement && !erreur && documentsPage.map((document) => {
                    const statut = nomStatut(document.statutIndexation);
                    return (
                      <tr key={document.id_document}>
                        <td><span className="editor-doc-name"><span className="editor-doc-icon"><FileText size={17} /></span><span title={document.titre}>{document.titre}</span></span></td>
                        <td><span className="editor-collection"><FolderOpen size={14} /> Collection {document.id_collection}</span></td>
                        <td className="editor-date">{dateLisible(document.date_ajout)}</td>
                        <td><span className={`editor-status editor-status--${statut.classe}`}>{statut.texte}</span></td>
                        <td><button type="button" className="editor-row-action" aria-label={`Gérer ${document.titre}`} title="Ouvrir la gestion documentaire" onClick={() => navigate(ROUTE_DOCUMENTS)}><MoreHorizontal size={20} /></button></td>
                      </tr>
                    );
                  })}
                  {chargement && <tr><td colSpan={5} className="editor-empty">Chargement des documents…</td></tr>}
                  {!chargement && !erreur && documentsPage.length === 0 && <tr><td colSpan={5} className="editor-empty">Aucun document disponible pour le moment.</td></tr>}
                  {!chargement && erreur && <tr><td colSpan={5} className="editor-empty">Impossible d'afficher les documents.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="editor-panel-footer">
              <span>{documentsTries.length === 0 ? "0 document" : `${(page - 1) * PAR_PAGE + 1}–${Math.min(page * PAR_PAGE, documentsTries.length)} sur ${documentsTries.length}`}</span>
              <div className="editor-pagination">
                <button type="button" aria-label="Page précédente" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={17} /></button>
                <span>Page {page} / {totalPages}</span>
                <button type="button" aria-label="Page suivante" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={17} /></button>
              </div>
            </div>
            <button type="button" className="editor-import-btn" onClick={() => navigate(ROUTE_DOCUMENTS)}><UploadCloud size={18} /> Importer des documents</button>
          </section>

          <section className="editor-panel editor-quick" aria-labelledby="editor-quick-title">
            <div className="editor-panel-heading"><div><h2 id="editor-quick-title">Actions rapides</h2><p>Accédez à vos outils essentiels</p></div></div>
            <div className="editor-actions">
              {actions.map(({ titre, description, Icone, chemin, couleur }) => (
                <button type="button" className="editor-action" key={titre} onClick={() => navigate(chemin)}>
                  <span className={`editor-action-icon editor-action-icon--${couleur}`}><Icone size={21} /></span>
                  <span className="editor-action-copy"><strong>{titre}</strong><small>{description}</small></span>
                  <ArrowUpRight size={18} className="editor-action-arrow" />
                </button>
              ))}
            </div>
            <div className="editor-tip"><FileCheck2 size={18} /><p>Les indicateurs reflètent uniquement les documents actifs accessibles à votre compte.</p></div>
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default EditorDashboard;
