
import { useEffect, useState } from "react";

import {
  Search,
  Sparkles,
  History,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Send,
  AlertCircle,
  LoaderCircle,
  CheckCircle2,
  BookOpen,
  Eye,
  FileSearch,
  ShieldCheck,
  MessageSquareText,
  X
} from "lucide-react";

import { useAuth } from "../contexts/useAuth";

import {
  poserQuestion,
  obtenirHistorique,
  obtenirDetailHistorique,
  evaluerReponse,
  obtenirInformationsDocument
} from "../services/rechercheService";

import DocumentViewer from "../components/documents/DocumentViewer";
import "../styles/RechercheDocumentaire.css";

/*
  Page Recherche documentaire DocuMind.

  Fonctionnalités :
  - Recherche RAG sécurisée
  - Affichage des réponses et sources
  - Consultation des documents originaux
  - Historique limité aux 5 dernières questions
  - Évaluation des réponses
  - Gestion des chargements et des erreurs
*/

const LIMITE_HISTORIQUE = 5;

const suggestions = [
  "Procédure d'accueil",
  "Politique de sécurité",
  "Gestion des accès",
  "Classification des documents"
];

// Récupérer l'identifiant du document source.
function obtenirIdDocument(source) {
  return (
    source?.id_doc ??
    source?.id_document ??
    source?.document?.id_doc ??
    null
  );
}

// Déterminer le titre d'un document source.
function obtenirTitreDocument(source) {
  return (
    source?.titre ??
    source?.nom_fichier ??
    source?.document_titre ??
    source?.nom_document ??
    source?.document?.titre ??
    (obtenirIdDocument(source) != null
      ? `Document ${obtenirIdDocument(source)}`
      : "Document source")
  );
}

// Normaliser les données retournées par l'historique.
function normaliserResultat(data) {
  return {
    ...data,
    reponse:
      data.reponse ??
      data.answer_text ??
      "",
    sources:
      data.sources ??
      data.passages ??
      [],
    id_answer:
      data.id_answer ??
      data.reponse_id ??
      null,
    abstention:
      data.abstention ??
      data.abstained ??
      false
  };
}


/*
  Afficher une source documentaire avec son vrai titre.

  Les métadonnées sont récupérées depuis FastAPI
  pour afficher le nom réel du fichier.
*/
function SourceDocument({
  source,
  index,
  onConsulter,
  consultationEnCours,
  token
}) {
  const idDocument = obtenirIdDocument(source);

  // Conserver les informations récupérées.
  const [informations, setInformations] = useState(null);

  // Récupérer le vrai titre depuis le backend.
  useEffect(() => {
    if (idDocument == null || !token) return;

    let actif = true;

    async function chargerInformations() {
      try {
        const data = await obtenirInformationsDocument(
          token,
          idDocument
        );

        if (actif) {
          setInformations(data);
        }
      } catch (err) {
        console.error(
          "Impossible de récupérer le titre :",
          err.message
        );
      }
    }

    chargerInformations();

    return () => {
      actif = false;
    };
  }, [idDocument, token]);

  // Utiliser en priorité le vrai titre.
  const titre =
    informations?.titre ??
    informations?.nom_fichier ??
    obtenirTitreDocument(source);

  const position = source.position;

  return (
    <div className="rag-source">

      <div className="rag-source-icon">
        <FileText size={22} />
      </div>

      <div className="rag-source-info">
        <strong>{titre}</strong>

        <p>
          {informations?.type_fichier
            ? informations.type_fichier.toUpperCase()
            : "Document source"}

          {position != null
            ? ` · Passage ${position + 1}`
            : ` · Source ${index + 1}`}
        </p>
      </div>

      <button
        type="button"
        className="rag-source-view-button"
        onClick={() => onConsulter(source)}
        disabled={
          idDocument == null ||
          consultationEnCours
        }
      >
        {consultationEnCours ? (
          <LoaderCircle
            size={17}
            className="rag-spin"
          />
        ) : (
          <Eye size={17} />
        )}

        Consulter
      </button>

    </div>
  );
}


// Afficher les bonnes pratiques de recherche.
function BonnesPratiques() {
  const conseils = [
    {
      icone: FileSearch,
      texte: "Formulez une question précise et concise."
    },
    {
      icone: Search,
      texte: "Utilisez des mots-clés liés à vos documents."
    },
    {
      icone: ShieldCheck,
      texte: "Vérifiez les sources proposées."
    },
    {
      icone: MessageSquareText,
      texte: "Évaluez les réponses pour améliorer DocuMind."
    }
  ];

  return (
    <div className="rag-side-panel rag-practices-panel">
      <div className="rag-panel-title">
        <CheckCircle2 size={21} />
        <h2>Bonnes pratiques</h2>
      </div>

      <div className="rag-practices-list">
        {conseils.map((conseil) => {
          const Icone = conseil.icone;

          return (
            <div
              key={conseil.texte}
              className="rag-practice-item"
            >
              <div className="rag-practice-icon">
                <Icone size={17} />
              </div>

              <p>{conseil.texte}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RechercheDocumentaire() {
  const { token } = useAuth();

  // États de la recherche documentaire.
  const [question, setQuestion] = useState("");
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  // États de l'historique personnel.
  const [historique, setHistorique] = useState([]);
  const [chargementHistorique, setChargementHistorique] =
    useState(true);

  // États des évaluations.
  const [evaluation, setEvaluation] = useState(null);
  const [commentaire, setCommentaire] = useState("");
  const [afficherCommentaire, setAfficherCommentaire] =
    useState(false);
  const [envoiEvaluation, setEnvoiEvaluation] =
    useState(false);
  const [messageEvaluation, setMessageEvaluation] =
    useState("");

  // États du lecteur documentaire.
  const [documentOuvert, setDocumentOuvert] =
    useState(null);

  const [documentEnChargement, setDocumentEnChargement] =
    useState(null);

  // Actualiser l'historique après une nouvelle recherche.
  async function chargerHistorique() {
    if (!token) return;

    setChargementHistorique(true);

    try {
      const data = await obtenirHistorique(
        token,
        LIMITE_HISTORIQUE
      );

      setHistorique(
        (data.historique || []).slice(
          0,
          LIMITE_HISTORIQUE
        )
      );
    } catch (err) {
      console.error(
        "Erreur de chargement de l'historique :",
        err.message
      );
    } finally {
      setChargementHistorique(false);
    }
  }

  // Charger l'historique à l'ouverture de la page.
  useEffect(() => {
    if (!token) return;

    let actif = true;

    async function initialiserHistorique() {
      try {
        const data = await obtenirHistorique(
          token,
          LIMITE_HISTORIQUE
        );

        if (actif) {
          setHistorique(
            (data.historique || []).slice(
              0,
              LIMITE_HISTORIQUE
            )
          );
        }
      } catch (err) {
        if (actif) {
          console.error(
            "Erreur de chargement :",
            err.message
          );
        }
      } finally {
        if (actif) {
          setChargementHistorique(false);
        }
      }
    }

    initialiserHistorique();

    return () => {
      actif = false;
    };
  }, [token]);

  // Réinitialiser l'évaluation lors du changement de réponse.
  function reinitialiserEvaluation() {
    setEvaluation(null);
    setCommentaire("");
    setAfficherCommentaire(false);
    setMessageEvaluation("");
  }

  // Poser une question au moteur RAG.
  async function rechercher(event) {
    event.preventDefault();

    const texte = question.trim();

    if (texte.length < 3 || chargement) return;

    setChargement(true);
    setErreur("");
    setResultat(null);
    setDocumentOuvert(null);

    reinitialiserEvaluation();

    try {
      const data = await poserQuestion(token, texte);

      setResultat(normaliserResultat(data));

      // L'historique est actualisé après la réponse.
      await chargerHistorique();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  // Consulter une ancienne question et sa réponse.
  async function ouvrirHistorique(item) {
    if (!item.id_query || chargement) return;

    setChargement(true);
    setErreur("");
    setDocumentOuvert(null);

    reinitialiserEvaluation();

    try {
      const data = await obtenirDetailHistorique(
        token,
        item.id_query
      );

      setResultat(normaliserResultat(data));

      setQuestion(
        data.question ??
        data.question_text ??
        ""
      );
    } catch (err) {
      // Masquer la réponse lorsque les droits ont changé.
      setResultat(null);
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  // Enregistrer une évaluation positive ou négative.
  async function envoyerEvaluation(estUtile) {
    if (!resultat?.id_answer || envoiEvaluation) {
      return;
    }

    setEnvoiEvaluation(true);
    setMessageEvaluation("");

    try {
      await evaluerReponse(
        token,
        resultat.id_answer,
        estUtile,
        commentaire.trim() || null
      );

      setEvaluation(estUtile);

      setMessageEvaluation(
        "Merci ! Votre évaluation a été enregistrée."
      );
    } catch (err) {
      setMessageEvaluation(err.message);
    } finally {
      setEnvoiEvaluation(false);
    }
  }

  // Récupérer les informations réelles du document
  // avant d'ouvrir la fenêtre de consultation.
  async function consulterDocument(source) {
    const idDocument = obtenirIdDocument(source);

    if (idDocument == null) {
      setErreur(
        "Impossible d'ouvrir ce document : " +
        "son identifiant est absent des sources."
      );
      return;
    }

    setErreur("");
    setDocumentEnChargement(idDocument);

    try {
      // FastAPI vérifie les droits et retourne
      // les métadonnées du document.
      const documentInfo =
        await obtenirInformationsDocument(
          token,
          idDocument
        );

      // Préparer les informations du lecteur.
      setDocumentOuvert({
        ...source,
        ...documentInfo,
        id_doc: idDocument,
        titre:
          documentInfo.titre ??
          documentInfo.nom_fichier ??
          obtenirTitreDocument(source),
        type_fichier:
          documentInfo.type_fichier ??
          source.type_fichier ??
          null
      });
    } catch (err) {
      setErreur(err.message);
    } finally {
      setDocumentEnChargement(null);
    }
  }

  return (
    <section className="rag-page">

      {/* EN-TÊTE */}
      <div className="rag-page-heading">
        <div className="rag-heading-icon">
          <Search size={28} />
        </div>

        <div>
          <h1>Recherche documentaire</h1>

          <p>
            Posez une question en langage naturel à
            l'assistant DocuMind et obtenez une réponse
            sourcée à partir de vos documents.
          </p>
        </div>
      </div>

      {/* FORMULAIRE DE RECHERCHE */}
      <form
        className="rag-search-form"
        onSubmit={rechercher}
      >
        <input
          type="text"
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          placeholder="Posez votre question documentaire..."
          maxLength={1500}
          aria-label="Question documentaire"
        />

        <button
          type="submit"
          disabled={
            chargement ||
            question.trim().length < 3
          }
        >
          {chargement ? (
            <LoaderCircle
              size={19}
              className="rag-spin"
            />
          ) : (
            <Search size={19} />
          )}

          {chargement
            ? "Recherche..."
            : "Rechercher"}
        </button>
      </form>

      {/* SUGGESTIONS */}
      <div className="rag-suggestions">
        <span>Suggestions :</span>

        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setQuestion(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* MESSAGES D'ERREUR */}
      {erreur && (
        <div className="rag-error" role="alert">
          <AlertCircle size={19} />
          <span>{erreur}</span>

          <button
            type="button"
            onClick={() => setErreur("")}
            aria-label="Fermer le message d'erreur"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* CONTENU PRINCIPAL */}
      <div className="rag-content-grid">

        {/* RÉPONSE DE DOCUMIND */}
        <div className="rag-answer-panel">
          <div className="rag-panel-heading">
            <div className="rag-panel-title">
              <Sparkles size={21} />
              <h2>Réponse de DocuMind</h2>
            </div>
          </div>

          {chargement ? (
            <div className="rag-empty">
              <LoaderCircle
                size={34}
                className="rag-spin"
              />

              <h3>Recherche en cours...</h3>

              <p>
                DocuMind analyse les documents accessibles
                et prépare votre réponse.
              </p>
            </div>
          ) : resultat ? (
            <>
              {/* RÉPONSE GÉNÉRÉE */}
              <div className="rag-answer-text">
                {resultat.abstention && (
                  <div className="rag-abstention">
                    <AlertCircle size={19} />
                    Informations documentaires insuffisantes
                  </div>
                )}

                <p>{resultat.reponse}</p>
              </div>

              {/* SOURCES DOCUMENTAIRES */}
              {!resultat.abstention &&
                Array.isArray(resultat.sources) &&
                resultat.sources.length > 0 && (
                  <div className="rag-sources">
                    <h3>
                      <FileText size={19} />
                      Sources documentaires
                      ({resultat.sources.length})
                    </h3>

                    <div className="rag-sources-list">
                      {resultat.sources.map(
                        (source, index) => (
                          <SourceDocument
                            key={
                              `${source.id_chunk ?? "source"}-${index}`
                            }
                            source={source}
                            index={index}
                            token={token}
                            onConsulter={consulterDocument}
                            consultationEnCours={
                              documentEnChargement ===
                              obtenirIdDocument(source)
                            }
                          />
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* ÉVALUATION */}
              {resultat.id_answer && (
                <div className="rag-feedback">
                  <span>
                    Cette réponse vous a-t-elle été utile ?
                  </span>

                  <button
                    type="button"
                    className={
                      evaluation === true
                        ? "selected-positive"
                        : ""
                    }
                    onClick={() =>
                      envoyerEvaluation(true)
                    }
                    disabled={envoiEvaluation}
                  >
                    <ThumbsUp size={17} />
                    Oui
                  </button>

                  <button
                    type="button"
                    className={
                      evaluation === false
                        ? "selected-negative"
                        : ""
                    }
                    onClick={() =>
                      envoyerEvaluation(false)
                    }
                    disabled={envoiEvaluation}
                  >
                    <ThumbsDown size={17} />
                    Non
                  </button>

                  <button
                    type="button"
                    className="rag-comment-button"
                    onClick={() =>
                      setAfficherCommentaire(
                        !afficherCommentaire
                      )
                    }
                  >
                    Ajouter un commentaire
                  </button>
                </div>
              )}

              {/* COMMENTAIRE FACULTATIF */}
              {afficherCommentaire &&
                resultat.id_answer && (
                  <div className="rag-comment-box">
                    <textarea
                      value={commentaire}
                      onChange={(event) =>
                        setCommentaire(event.target.value)
                      }
                      maxLength={2000}
                      placeholder="Expliquez votre évaluation..."
                      rows={3}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        envoyerEvaluation(
                          evaluation ?? true
                        )
                      }
                      disabled={envoiEvaluation}
                    >
                      <Send size={16} />
                      Enregistrer mon commentaire
                    </button>
                  </div>
                )}

              {messageEvaluation && (
                <p
                  className="rag-feedback-message"
                  role="status"
                >
                  {messageEvaluation}
                </p>
              )}
            </>
          ) : (
            <div className="rag-empty">
              <BookOpen size={40} />

              <h3>
                Votre assistant documentaire est prêt
              </h3>

              <p>
                Posez une question pour obtenir une réponse
                fondée sur les documents autorisés.
              </p>
            </div>
          )}
        </div>

        {/* COLONNE LATÉRALE */}
        <aside className="rag-right-column">

          {/* HISTORIQUE : 5 DERNIÈRES QUESTIONS */}
          <div className="rag-side-panel">
            <div className="rag-panel-title">
              <History size={21} />
              <h2>Historique de vos questions</h2>
            </div>

            {chargementHistorique ? (
              <p className="rag-muted">
                Chargement de l'historique...
              </p>
            ) : historique.length === 0 ? (
              <p className="rag-muted">
                Aucune recherche enregistrée.
              </p>
            ) : (
              <div className="rag-history-list">
                {historique
                  .slice(0, LIMITE_HISTORIQUE)
                  .map((item) => (
                    <button
                      key={item.id_query}
                      type="button"
                      onClick={() =>
                        ouvrirHistorique(item)
                      }
                      disabled={chargement}
                    >
                      <Search size={17} />

                      <span>
                        {item.question ??
                          item.question_text ??
                          `Question ${item.id_query}`}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* BONNES PRATIQUES */}
          <BonnesPratiques />
        </aside>
      </div>

      {/* LECTEUR DOCUMENTAIRE INTÉGRÉ */}
      {documentOuvert && (
        <DocumentViewer
          document={documentOuvert}
          token={token}
          onClose={() =>
            setDocumentOuvert(null)
          }
        />
      )}
    </section>
  );
}

export default RechercheDocumentaire;
