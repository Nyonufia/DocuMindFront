
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  History,
  FileText,
  Layers,
  MessageCircle,
  ArrowRight,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Send,
  UsersRound
} from "lucide-react";

import { useAuth } from "../contexts/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";

import {
  listerDocuments,
  obtenirDocumentsConsultes,
  enregistrerConsultation
} from "../services/documentService";

import {
  obtenirHistorique,
  evaluerReponse,
  recupererDocument
} from "../services/rechercheService";

import "../styles/EmployeeDashboard.css";

// Tableau de bord Employé DocuMind.
// Les données sont récupérées depuis les API sécurisées FastAPI.

function EmployeeDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Documents accessibles.
  const [documents, setDocuments] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  // Historique des recherches.
  const [recherchesRecentes, setRecherchesRecentes] = useState([]);
  const [chargementHistorique, setChargementHistorique] = useState(true);
  const [erreurHistorique, setErreurHistorique] = useState("");

  // Historique des consultations documentaires.
  const [documentsConsultes, setDocumentsConsultes] = useState([]);
  const [chargementConsultations, setChargementConsultations] =
    useState(true);
  const [erreurConsultations, setErreurConsultations] = useState("");

  // Feedback automatiquement associé à la dernière question RAG.
  const [avis, setAvis] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [envoiFeedback, setEnvoiFeedback] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState("");
  const [erreurFeedback, setErreurFeedback] = useState("");

  // Ne jamais utiliser une question plus ancienne si la dernière est révoquée
  // ou si le moteur RAG n'a pas pu fournir de réponse documentaire.
  const derniereQuestion = recherchesRecentes[0] ?? null;
  const reponseEvaluable = Boolean(
    derniereQuestion &&
    !derniereQuestion.acces_revoque &&
    !derniereQuestion.abstention &&
    derniereQuestion.id_answer
  );

  /*
    Charger les documents accessibles à l'employé.
  */
  useEffect(() => {
    if (!token) return;

    let actif = true;

    async function chargerDocuments() {
      try {
        const resultat = await listerDocuments(token);

        if (!actif) return;

        setDocuments(
          Array.isArray(resultat)
            ? resultat
            : resultat?.documents ?? []
        );
      } catch (err) {
        if (actif) {
          setErreur(
            err.message || "Impossible de charger les documents."
          );
        }
      } finally {
        if (actif) {
          setChargement(false);
        }
      }
    }

    Promise.resolve().then(() => {
      if (!actif) return;

      setChargement(true);
      setErreur("");
      chargerDocuments();
    });

    return () => {
      actif = false;
    };
  }, [token]);

  /*
    Charger les trois dernières recherches de l'employé.
  */
  useEffect(() => {
    if (!token) return;

    let actif = true;

    async function chargerHistorique() {
      try {
        const resultat = await obtenirHistorique(token, 3);

        if (!actif) return;

        setRecherchesRecentes(
          Array.isArray(resultat?.historique)
            ? resultat.historique
            : []
        );
        setMessageFeedback("");
        setErreurFeedback("");
      } catch (err) {
        if (actif) {
          setErreurHistorique(
            err.message || "Impossible de charger l'historique."
          );
        }
      } finally {
        if (actif) {
          setChargementHistorique(false);
        }
      }
    }

    Promise.resolve().then(() => {
      if (!actif) return;

      setChargementHistorique(true);
      setErreurHistorique("");
      chargerHistorique();
    });

    return () => {
      actif = false;
    };
  }, [token]);

  /*
    Charger les trois derniers documents réellement consultés.
    Le backend vérifie les autorisations actuelles.
  */
  useEffect(() => {
    if (!token) return;

    let actif = true;

    async function chargerConsultations() {
      try {
        const resultat = await obtenirDocumentsConsultes(token, 3);

        if (!actif) return;

        setDocumentsConsultes(
          Array.isArray(resultat?.documents)
            ? resultat.documents
            : []
        );
      } catch (err) {
        if (actif) {
          setErreurConsultations(
            err.message ||
              "Impossible de charger les consultations."
          );
        }
      } finally {
        if (actif) {
          setChargementConsultations(false);
        }
      }
    }

    Promise.resolve().then(() => {
      if (!actif) return;

      setChargementConsultations(true);
      setErreurConsultations("");
      chargerConsultations();
    });

    return () => {
      actif = false;
    };
  }, [token]);

  /*
    Afficher les trois documents les plus récemment ajoutés
    parmi ceux auxquels l'employé a accès.
  */
  const documentsAccessibles = useMemo(
    () =>
      [...documents]
        .sort((a, b) => {
          const dateA = new Date(a.date_ajout).getTime();
          const dateB = new Date(b.date_ajout).getTime();

          return (
            (Number.isNaN(dateB) ? 0 : dateB) -
            (Number.isNaN(dateA) ? 0 : dateA)
          );
        })
        .slice(0, 3),
    [documents]
  );

  // Ouvrir l'espace documentaire.
  function ouvrirDocuments() {
    navigate("/documents");
  }

  /*
    Formater les dates provenant du backend.
    Les dates d'audit sont enregistrées en UTC.
  */
  function formaterDate(date) {
    if (!date) return "";

    const valeur = String(date);
    const dateNormalisee = /(?:Z|[+-]\d{2}:\d{2})$/i.test(valeur)
      ? valeur
      : `${valeur}Z`;

    const resultat = new Date(dateNormalisee);

    return Number.isNaN(resultat.getTime())
      ? ""
      : resultat.toLocaleDateString("fr-CA", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
  }

  /*
    Récupérer le fichier original avec le JWT,
    puis l'ouvrir ou le télécharger.
  */
  async function accederFichier(document, telecharger = false) {
    const id = document.id_document ?? document.id_doc;

    if (!id) {
      setErreur("Identifiant du document introuvable.");
      return;
    }

    let url = null;

    try {
      setErreur("");

      // FastAPI vérifie les autorisations avant de fournir le fichier.
      const blob = await recupererDocument(token, id);

      // Ouvrir le fichier dans un nouvel onglet si demandé.
      if (!telecharger) {
        const onglet = window.open("", "_blank");

        if (!onglet) {
          throw new Error(
            "Autorisez les fenêtres contextuelles pour consulter le document."
          );
        }

        const typeMime = blob.type || "application/octet-stream";

        url = URL.createObjectURL(
          new Blob([blob], { type: typeMime })
        );

        onglet.location.href = url;

        // Enregistrer la consultation après l'accès au fichier.
        try {
          await enregistrerConsultation(token, id);

          // Actualiser les trois dernières consultations.
          const resultat = await obtenirDocumentsConsultes(token, 3);

          setDocumentsConsultes(
            Array.isArray(resultat?.documents)
              ? resultat.documents
              : []
          );

          setErreurConsultations("");
        } catch (err) {
          setErreurConsultations(
            err.message ||
              "Le document a été ouvert, mais sa consultation n'a pas pu être enregistrée."
          );
        }

        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }

      // Télécharger le fichier sans créer de consultation.
      url = URL.createObjectURL(blob);

      const lien = window.document.createElement("a");
      lien.href = url;
      lien.download = document.titre || `document-${id}`;

      window.document.body.appendChild(lien);
      lien.click();
      lien.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (url) URL.revokeObjectURL(url);

      setErreur(
        err.message || "Impossible d'accéder au document."
      );
    }
  }

  // Enregistrer le feedback sur la dernière réponse RAG personnelle.
  async function envoyerFeedback() {
    if (!avis || !reponseEvaluable || envoiFeedback) return;

    setEnvoiFeedback(true);
    setErreurFeedback("");
    setMessageFeedback("");

    try {
      // Recontrôler la dernière question et les droits juste avant l'envoi.
      // Cela évite d'évaluer une réponse devenue ancienne ou inaccessible.
      const resultat = await obtenirHistorique(token, 1);
      const derniere = resultat?.historique?.[0];

      if (
        !derniere ||
        derniere.acces_revoque ||
        derniere.abstention ||
        !derniere.id_answer ||
        derniere.id_query !== derniereQuestion?.id_query
      ) {
        throw new Error(
          "La dernière réponse a changé ou n'est plus évaluable. Actualisez le tableau de bord."
        );
      }

      const resultatFeedback = await evaluerReponse(
        token,
        derniere.id_answer,
        avis === "utile",
        commentaire.trim() || null
      );

      // Réinitialiser le formulaire uniquement après un envoi réussi.
      // Conserver la dernière question affichée et le message de confirmation.
      setAvis("");
      setCommentaire("");
      setMessageFeedback(
        resultatFeedback?.message || "Votre avis a été enregistré."
      );
    } catch (err) {
      setErreurFeedback(err.message || "Impossible d'enregistrer votre avis.");
    } finally {
      setEnvoiFeedback(false);
    }
  }

  return (
    <DashboardLayout roleName="Employé">
      <section className="employee-dashboard">

        {/* Message de bienvenue personnalisé */}
        <div className="employee-welcome">
          <div className="employee-welcome-icon">
            <UsersRound size={34} />
          </div>

          <div>
            <h1>
              Bonjour{" "}
              <span>{user?.prenom || "cher utilisateur"}</span>
            </h1>

            <p>
              Bienvenue sur votre tableau de bord DocuMind.
              Accédez rapidement aux informations de votre organisation
              et consultez les documents auxquels vous êtes autorisé.
            </p>
          </div>
        </div>

        {/* Affichage des erreurs générales */}
        {erreur && (
          <div className="employee-error" role="alert">
            <AlertCircle size={18} />
            <span>{erreur}</span>

            <button
              type="button"
              onClick={() => setErreur("")}
              aria-label="Fermer le message"
            >
              ×
            </button>
          </div>
        )}

        <div className="employee-dashboard-grid">

          {/* Recherches récentes */}
          <article className="employee-card">
            <div className="employee-card-header">
              <div className="employee-card-title">
                <History size={25} />
                <h2>Recherches récentes</h2>
              </div>

              <button
                type="button"
                className="employee-text-button"
                onClick={() => navigate("/recherche")}
              >
                Tout voir <ArrowRight size={17} />
              </button>
            </div>

            {chargementHistorique ? (
              <div className="employee-empty">
                <p>Chargement des recherches...</p>
              </div>
            ) : erreurHistorique ? (
              <div className="employee-empty">
                <AlertCircle size={24} />
                <p>{erreurHistorique}</p>
              </div>
            ) : recherchesRecentes.length === 0 ? (
              <div className="employee-empty">
                <History size={25} />
                <p>
                  Vous n'avez effectué aucune recherche récemment.
                </p>
              </div>
            ) : (
              <div className="employee-items">
                {recherchesRecentes.map((item) => (
                  <button
                    key={item.id_query}
                    type="button"
                    className="employee-item"
                    onClick={() =>
                      navigate(
                        `/recherche?historique=${item.id_query}`
                      )
                    }
                  >
                    <Search size={18} />

                    <span>{item.question}</span>

                    <small>
                      {item.date_question
                        ? new Date(
                            item.date_question
                          ).toLocaleDateString("fr-CA")
                        : ""}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </article>

          {/* Documents réellement consultés */}
          <article className="employee-card">
            <div className="employee-card-header">
              <div className="employee-card-title">
                <FileText size={25} />
                <h2>Documents consultés</h2>
              </div>

              <button
                type="button"
                className="employee-text-button"
                onClick={ouvrirDocuments}
              >
                Tout voir <ArrowRight size={17} />
              </button>
            </div>

            {chargementConsultations ? (
              <div className="employee-empty">
                <RefreshCw size={23} />
                <p>Chargement des consultations...</p>
              </div>
            ) : erreurConsultations ? (
              <div className="employee-empty">
                <AlertCircle size={24} />
                <p>{erreurConsultations}</p>
              </div>
            ) : documentsConsultes.length === 0 ? (
              <div className="employee-empty">
                <FileText size={25} />
                <p>
                  Aucun historique de consultation disponible.
                </p>
              </div>
            ) : (
              <div className="employee-items">
                {documentsConsultes.map((document) => (
                  <button
                    key={document.id_document}
                    type="button"
                    className="employee-item"
                    title="Consulter ce document"
                    onClick={() =>
                      accederFichier(document, false)
                    }
                  >
                    <FileText size={18} />

                    <span>{document.titre}</span>

                    <small>
                      {formaterDate(
                        document.date_consultation
                      )}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </article>

          {/* Sources documentaires accessibles */}
          <article className="employee-card">
            <div className="employee-card-header">
              <div className="employee-card-title">
                <Layers size={25} />
                <h2>Sources pertinentes</h2>
              </div>
            </div>

            <p className="employee-card-description">
              Les 3 derniers documents ajoutés à vos collections documentaires.
            </p>

            {chargement ? (
              <div className="employee-empty">
                <RefreshCw size={23} />
                <p>Chargement des documents...</p>
              </div>
            ) : documentsAccessibles.length === 0 ? (
              <div className="employee-empty">
                <FileText size={25} />
                <p>
                  Aucun document accessible pour le moment.
                </p>
              </div>
            ) : (
              <div className="employee-items">
                {documentsAccessibles.map((document) => {
                  const id =
                    document.id_document ?? document.id_doc;

                  return (
                    <div
                      className="employee-document"
                      key={id}
                    >
                      <div className="employee-document-icon">
                        <FileText size={23} />
                      </div>

                      <div className="employee-document-info">
                        <strong>{document.titre}</strong>

                        <small>
                          {String(
                            document.type_fichier || "Document"
                          ).toUpperCase()}
                        </small>
                      </div>

                      <div className="employee-document-actions">
                        <button
                          type="button"
                          title="Consulter le document"
                          onClick={() =>
                            accederFichier(document, false)
                          }
                        >
                          <Eye size={16} />
                          Consulter
                        </button>

                        <button
                          type="button"
                          title="Télécharger"
                          onClick={() =>
                            accederFichier(document, true)
                          }
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          {/* Feedback associé aux réponses RAG */}
          <article className="employee-card">
            <div className="employee-card-header">
              <div className="employee-card-title">
                <MessageCircle size={25} />
                <h2>Votre avis compte</h2>
              </div>
            </div>

            <p className="employee-card-description">
              Aidez-nous à améliorer la qualité des réponses
              et des documents proposés.
            </p>

            <div className="employee-feedback">
              {chargementHistorique ? (
                <small>Recherche de votre dernière question...</small>
              ) : erreurHistorique ? (
                <small role="alert">{erreurHistorique}</small>
              ) : !derniereQuestion ? (
                <small>Posez d'abord une question dans la recherche documentaire pour donner votre avis.</small>
              ) : !reponseEvaluable ? (
                <small>
                  Votre dernière question ne possède pas de réponse évaluable
                  ou son accès a été révoqué. Posez une nouvelle question pour donner votre avis.
                </small>
              ) : (
                <div>
                  <small>Votre avis sera associé à votre dernière question :</small>
                  <p><strong>{derniereQuestion.question}</strong></p>
                </div>
              )}

              <label>
                <input
                  type="radio"
                  name="avis-employe"
                  value="utile"
                  checked={avis === "utile"}
                  disabled={!reponseEvaluable || envoiFeedback}
                  onChange={(event) => {
                    setAvis(event.target.value);
                    setMessageFeedback("");
                  }}
                />
                La réponse m'a été utile
              </label>

              <label>
                <input
                  type="radio"
                  name="avis-employe"
                  value="insatisfaisante"
                  checked={avis === "insatisfaisante"}
                  disabled={!reponseEvaluable || envoiFeedback}
                  onChange={(event) => {
                    setAvis(event.target.value);
                    setMessageFeedback("");
                  }}
                />
                La réponse n'a pas été satisfaisante
              </label>

              <textarea
                rows={3}
                value={commentaire}
                maxLength={2000}
                disabled={!reponseEvaluable || envoiFeedback}
                onChange={(event) => {
                  setCommentaire(event.target.value);
                  setMessageFeedback("");
                }}
                placeholder="Votre commentaire (facultatif)..."
              />

              <button
                type="button"
                onClick={envoyerFeedback}
                disabled={!avis || !reponseEvaluable || envoiFeedback}
              >
                <Send size={17} />
                {envoiFeedback ? "Envoi en cours..." : "Envoyer le feedback"}
              </button>

              {messageFeedback && (
                <small role="status">{messageFeedback}</small>
              )}
              {erreurFeedback && (
                <small role="alert">{erreurFeedback}</small>
              )}
              <small>
                Vous pouvez soumettre à nouveau un avis pour modifier votre évaluation.
              </small>
            </div>
          </article>

        </div>
      </section>
    </DashboardLayout>
  );
}

export default EmployeeDashboard;
