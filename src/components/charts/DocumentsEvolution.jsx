
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { ChartNoAxesCombined } from "lucide-react";
import "./DocumentsEvolution.css";

/*
  DOCUMIND — ÉVOLUTION DES DOCUMENTS

  Ce composant permet de visualiser :
  - Les ajouts quotidiens de documents.
  - Le total cumulé des ajouts sur la période.

  Les données proviennent du tableau de bord administrateur.
*/
function DocumentsEvolution({ data = [] }) {

  // Mode d'affichage sélectionné par l'administrateur.
  const [mode, setMode] = useState("daily");

  /*
    Préparer les données pour Recharts.

    Le calcul utilise reduce() pour éviter les mutations
    de variables externes et respecter les règles React.
  */
  const donneesGraphique = useMemo(() => {

    const resultat = data.reduce(
      (acc, point) => {

        // Nombre de documents ajoutés pendant la journée.
        const valeur = Number(point.total);
        const ajouts = Number.isFinite(valeur) ? valeur : 0;

        // Calcul du total cumulé.
        const nouveauCumul = acc.cumul + ajouts;

        // Valeur affichée selon le mode choisi.
        const nouveauPoint = {
          ...point,
          total: mode === "cumulative"
            ? nouveauCumul
            : ajouts
        };

        return {
          cumul: nouveauCumul,
          points: [...acc.points, nouveauPoint]
        };
      },
      {
        cumul: 0,
        points: []
      }
    );

    return resultat.points;

  }, [data, mode]);

  // Vérifier si des données sont disponibles.
  const hasData = donneesGraphique.length > 0;

  // Libellé utilisé dans le graphique et l'infobulle.
  const libelle = mode === "daily"
    ? "Documents ajoutés"
    : "Documents cumulés";

  return (
    <section className="documents-chart">

      {/* En-tête du graphique. */}
      <div className="documents-chart-header">

        <div className="documents-chart-icon">
          <ChartNoAxesCombined size={22} />
        </div>

        <div className="documents-chart-heading">
          <h2>Évolution des documents</h2>
          <span>(30 derniers jours)</span>
        </div>

        {/* Boutons de sélection du mode d'affichage. */}
        <div
          className="documents-chart-modes"
          role="group"
          aria-label="Mode d'affichage du graphique"
        >

          <button
            type="button"
            className={`documents-chart-mode ${
              mode === "daily" ? "is-active" : ""
            }`}
            aria-pressed={mode === "daily"}
            onClick={() => setMode("daily")}
          >
            Ajouts quotidiens
          </button>

          <button
            type="button"
            className={`documents-chart-mode ${
              mode === "cumulative" ? "is-active" : ""
            }`}
            aria-pressed={mode === "cumulative"}
            onClick={() => setMode("cumulative")}
          >
            Total cumulé
          </button>

        </div>
      </div>

      {/* Afficher le graphique lorsque des données existent. */}
      {hasData ? (

        <div className="documents-chart-area">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart
              data={donneesGraphique}
              margin={{
                top: 15,
                right: 15,
                left: 0,
                bottom: 5
              }}
            >

              {/* Grille horizontale. */}
              <CartesianGrid
                stroke="#24415f"
                vertical={false}
              />

              {/* Axe des dates. */}
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{
                  fill: "#cbd5e1",
                  fontSize: 12
                }}
                tickLine={false}
              />

              {/* Axe du nombre de documents. */}
              <YAxis
                stroke="#94a3b8"
                tick={{
                  fill: "#cbd5e1",
                  fontSize: 12
                }}
                tickLine={false}
                allowDecimals={false}
              />

              {/* Informations affichées au survol. */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#10243b",
                  border: "1px solid #31567c",
                  borderRadius: "10px",
                  color: "#ffffff"
                }}
                formatter={(value) => [
                  value,
                  libelle
                ]}
              />

              {/* Courbe principale. */}
              <Line
                type="monotone"
                dataKey="total"
                name={libelle}
                stroke="#16a6ff"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#16a6ff",
                  stroke: "#ffffff",
                  strokeWidth: 2
                }}
                activeDot={{
                  r: 6
                }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      ) : (

        /* Message affiché en absence de données. */
        <div className="documents-chart-empty">

          <ChartNoAxesCombined size={38} />

          <p>
            Aucune donnée disponible pour le moment.
          </p>

          <span>
            L'évolution des documents apparaîtra ici
            lorsque les statistiques seront disponibles.
          </span>

        </div>

      )}

    </section>
  );
}

export default DocumentsEvolution;
