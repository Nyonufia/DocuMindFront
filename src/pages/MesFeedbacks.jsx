
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  MessageSquareText,
  RefreshCw,
  Search,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { useAuth } from "../contexts/useAuth";

import {
  getMesFeedbacks,
  getTousLesFeedbacks,
  getStatistiquesFeedbacks
} from "../services/feedbackService";

import "./MesFeedbacks.css";

/*
  DOCUMIND — CONSULTATION DES FEEDBACKS

  Fonctionnalités :
  - Consultation des évaluations personnelles
  - Consultation globale réservée à l'administrateur
  - Statistiques globales pour l'administrateur
  - Recherche et filtrage des évaluations
  - Pagination de 5 feedbacks par page
  - Actualisation des données
*/

const ELEMENTS_PAR_PAGE = 5;

/*
  Convertir la date d'une évaluation
  en format lisible.
*/
function dateLisible(valeur) {
  if (!valeur) return "—";

  const date = new Date(valeur);

  return Number.isNaN(date.getTime())
    ? String(valeur)
    : date.toLocaleString("fr-CA", {
        dateStyle: "medium",
        timeStyle: "short"
      });
}

export default function MesFeedbacks() {

  // Récupérer l'utilisateur et son JWT.
  const { user, token } = useAuth();

  const estAdmin = user?.id_role === 3;

  // Identifier la vue depuis l'URL.
  const [searchParams, setSearchParams] = useSearchParams();

  const vue =
    estAdmin && searchParams.get("vue") === "tous"
      ? "tous"
      : "mes";

  /*
    États de gestion des feedbacks.
  */
  const [evaluations, setEvaluations] = useState([]);
  const [statistiques, setStatistiques] = useState(null);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");

  const [actualisation, setActualisation] = useState(0);

  // Page actuellement sélectionnée.
  const [page, setPage] = useState(1);

  /*
    Charger les évaluations depuis FastAPI.

    Chaque utilisateur récupère ses propres feedbacks.
    L'administrateur peut récupérer tous les feedbacks.
  */
  useEffect(() => {
    let actif = true;

    async function charger() {

      if (!token) {
        if (actif) {
          setEvaluations([]);
          setErreur("Session d'authentification indisponible.");
          setChargement(false);
        }
        return;
      }

      try {

        const resultat =
          vue === "tous"
            ? await getTousLesFeedbacks(token)
            : await getMesFeedbacks(token);

        if (!actif) return;

        const liste = Array.isArray(resultat.feedbacks)
          ? resultat.feedbacks
          : Array.isArray(resultat.evaluations)
            ? resultat.evaluations
            : [];

        setEvaluations(liste);
        setErreur("");

      } catch (e) {

        if (!actif) return;

        setEvaluations([]);

        setErreur(
          e.message || "Impossible de charger les feedbacks."
        );

      } finally {

        if (actif) {
          setChargement(false);
        }
      }
    }

    charger();

    return () => {
      actif = false;
    };

  }, [token, vue, actualisation]);

  /*
    Charger les statistiques globales.

    Cette requête est réservée à l'administrateur.
  */
  useEffect(() => {

    if (!token || !estAdmin) return;

    let actif = true;

    getStatistiquesFeedbacks(token)
      .then((donnees) => {
        if (actif) {
          setStatistiques(donnees);
        }
      })
      .catch(() => {
        if (actif) {
          setStatistiques(null);
        }
      });

    return () => {
      actif = false;
    };

  }, [token, estAdmin, actualisation]);

  /*
    Filtrer les évaluations selon :
    - Le texte recherché
    - Le statut utile / non utile
  */
  const evaluationsFiltrees = useMemo(() => {

    const texte = recherche
      .trim()
      .toLocaleLowerCase("fr");

    return evaluations.filter((evaluation) => {

      if (
        filtre === "utiles" &&
        !evaluation.est_utile
      ) {
        return false;
      }

      if (
        filtre === "non-utiles" &&
        evaluation.est_utile
      ) {
        return false;
      }

      const contenu = [
        evaluation.commentaire,
        evaluation.username,
        evaluation.id_answer,
        evaluation.id_feedback
      ]
        .filter((valeur) => valeur !== null && valeur !== undefined)
        .join(" ")
        .toLocaleLowerCase("fr");

      return contenu.includes(texte);
    });

  }, [evaluations, recherche, filtre]);

  /*
    Calculer la pagination après filtrage.

    La pagination ne modifie jamais
    le tableau original des évaluations.
  */
  const nombreResultats = evaluationsFiltrees.length;

  const totalPages = Math.max(
    1,
    Math.ceil(nombreResultats / ELEMENTS_PAR_PAGE)
  );

  // Conserver une page valide si les résultats diminuent.
  const pageActuelle = Math.min(
    Math.max(page, 1),
    totalPages
  );

  const debut = (
    pageActuelle - 1
  ) * ELEMENTS_PAR_PAGE;

  // Sélectionner uniquement 5 évaluations.
  const evaluationsAffichees = evaluationsFiltrees.slice(
    debut,
    debut + ELEMENTS_PAR_PAGE
  );

  const premierElement =
    nombreResultats > 0 ? debut + 1 : 0;

  const dernierElement = Math.min(
    debut + ELEMENTS_PAR_PAGE,
    nombreResultats
  );

  /*
    Calculer les nombres d'évaluations
    pour la vue actuellement affichée.
  */
  const nombreUtiles = evaluations.filter(
    (evaluation) => evaluation.est_utile
  ).length;

  const nombreNonUtiles =
    evaluations.length - nombreUtiles;

  /*
    Changer de vue pour l'administrateur.

    Réinitialiser les filtres et la pagination.
  */
  function changerVue(nouvelleVue) {

    if (!estAdmin || nouvelleVue === vue) return;

    setChargement(true);
    setErreur("");

    setRecherche("");
    setFiltre("tous");
    setPage(1);

    setSearchParams(
      nouvelleVue === "tous"
        ? { vue: "tous" }
        : {}
    );
  }

  /*
    Actualiser les données affichées.
  */
  function actualiser() {

    setChargement(true);
    setErreur("");

    setActualisation(
      (precedent) => precedent + 1
    );
  }

  /*
    Modifier la recherche.

    Revenir automatiquement à la première page.
  */
  function changerRecherche(valeur) {

    setRecherche(valeur);
    setPage(1);
  }

  /*
    Modifier le filtre des évaluations.

    Revenir automatiquement à la première page.
  */
  function changerFiltre(valeur) {

    setFiltre(valeur);
    setPage(1);
  }

  return (
    <section className="feedback-page">

      {/* =====================================
          EN-TÊTE
      ===================================== */}
      <div className="feedback-heading">

        <div>
          <span className="feedback-eyebrow">
            DOCUMIND · QUALITÉ DES RÉPONSES
          </span>

          <h1>
            {estAdmin
              ? "Qualité et audit"
              : "Mes feedbacks"}
          </h1>

          <p>
            {estAdmin
              ? "Suivez la qualité des réponses RAG et consultez les évaluations des utilisateurs."
              : "Retrouvez les évaluations que vous avez données aux réponses RAG."}
          </p>
        </div>

        <button
          type="button"
          className="feedback-secondary"
          onClick={actualiser}
          disabled={chargement}
        >
          <RefreshCw size={17} />
          Actualiser
        </button>

      </div>

      {/* =====================================
          STATISTIQUES ADMINISTRATEUR
      ===================================== */}
      {estAdmin && statistiques && (

        <div
          className="feedback-stats"
          aria-label="Statistiques globales"
        >

          <div>
            <span>Total des évaluations</span>
            <strong>
              {statistiques.total_evaluations ?? 0}
            </strong>
          </div>

          <div>
            <span>Réponses utiles</span>
            <strong>
              {statistiques.reponses_utiles ?? 0}
            </strong>
          </div>

          <div>
            <span>Réponses non utiles</span>
            <strong>
              {statistiques.reponses_non_utiles ?? 0}
            </strong>
          </div>

          <div>
            <span>Taux de satisfaction</span>
            <strong>
              {statistiques.taux_satisfaction ?? 0} %
            </strong>
          </div>

        </div>
      )}

      {/* =====================================
          ONGLETS ADMINISTRATEUR
      ===================================== */}
      {estAdmin && (

        <div
          className="feedback-tabs"
          role="group"
          aria-label="Choisir les évaluations à afficher"
        >

          <button
            type="button"
            className={
              vue === "mes" ? "active" : ""
            }
            onClick={() => changerVue("mes")}
            aria-pressed={vue === "mes"}
          >
            Mes feedbacks
          </button>

          <button
            type="button"
            className={
              vue === "tous" ? "active" : ""
            }
            onClick={() => changerVue("tous")}
            aria-pressed={vue === "tous"}
          >
            Tous les feedbacks
          </button>

        </div>
      )}

      {/* =====================================
          TABLEAU DES FEEDBACKS
      ===================================== */}
      <div className="feedback-panel">

        {/* Recherche et filtres */}
        <div className="feedback-toolbar">

          <div className="feedback-search">

            <Search size={18} />

            <input
              type="search"
              value={recherche}
              onChange={(e) =>
                changerRecherche(e.target.value)
              }
              placeholder="Rechercher un commentaire, un utilisateur ou une réponse..."
              aria-label="Rechercher des feedbacks"
            />

          </div>

          <select
            value={filtre}
            onChange={(e) =>
              changerFiltre(e.target.value)
            }
            aria-label="Filtrer les évaluations"
          >
            <option value="tous">
              Toutes les évaluations
            </option>

            <option value="utiles">
              Utiles
            </option>

            <option value="non-utiles">
              Non utiles
            </option>
          </select>

        </div>

        {/* Résumé des évaluations */}
        {!chargement && !erreur && (

          <div className="feedback-counts">

            <span>
              {nombreResultats} résultat(s)
            </span>

            <span>
              <ThumbsUp size={15} />
              {nombreUtiles} utile(s)
            </span>

            <span>
              <ThumbsDown size={15} />
              {nombreNonUtiles} non utile(s)
            </span>

          </div>
        )}

        {/* Chargement */}
        {chargement ? (

          <p
            className="feedback-message"
            role="status"
          >
            Chargement des feedbacks...
          </p>

        ) : erreur ? (

          /* Message d'erreur */
          <div
            className="feedback-error"
            role="alert"
          >
            {erreur}
          </div>

        ) : nombreResultats === 0 ? (

          /* Aucun résultat */
          <div className="feedback-empty">

            <MessageSquareText size={32} />

            <p>
              {evaluations.length === 0
                ? "Aucun feedback enregistré pour cette vue."
                : "Aucun feedback ne correspond aux filtres."}
            </p>

          </div>

        ) : (

          /* Tableau des évaluations */
          <div className="feedback-table-scroll">

            <table className="feedback-table">

              <thead>
                <tr>
                  <th>Réponse</th>

                  {vue === "tous" && (
                    <th>Utilisateur</th>
                  )}

                  <th>Évaluation</th>
                  <th>Commentaire</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {evaluationsAffichees.map(
                  (evaluation) => (

                    <tr key={evaluation.id_feedback}>

                      <td>
                        #{evaluation.id_answer}
                      </td>

                      {vue === "tous" && (
                        <td>
                          {evaluation.username ||
                            `Utilisateur #${evaluation.id_user}`}
                        </td>
                      )}

                      <td>
                        <span
                          className={
                            `feedback-status ${
                              evaluation.est_utile
                                ? "feedback-status--useful"
                                : "feedback-status--not-useful"
                            }`
                          }
                        >
                          {evaluation.est_utile
                            ? "Utile"
                            : "Non utile"}
                        </span>
                      </td>

                      <td className="feedback-comment">
                        {evaluation.commentaire ||
                          "Aucun commentaire"}
                      </td>

                      <td>
                        {dateLisible(
                          evaluation.date_feedback
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* =====================================
            PAGINATION
        ===================================== */}
        {!chargement &&
          !erreur &&
          nombreResultats > 0 && (

          <div className="feedback-pagination">

            <span className="feedback-pagination-info">
              Affichage de {premierElement} à {dernierElement}
              {" "}sur {nombreResultats} évaluations
            </span>

            <div className="feedback-pagination-actions">

              <button
                type="button"
                disabled={pageActuelle <= 1}
                onClick={() =>
                  setPage(pageActuelle - 1)
                }
              >
                <ChevronLeft size={16} />
                Précédent
              </button>

              <span>
                Page {pageActuelle} sur {totalPages}
              </span>

              <button
                type="button"
                disabled={pageActuelle >= totalPages}
                onClick={() =>
                  setPage(pageActuelle + 1)
                }
              >
                Suivant
                <ChevronRight size={16} />
              </button>

            </div>

          </div>
        )}

      </div>

    </section>
  );
}
