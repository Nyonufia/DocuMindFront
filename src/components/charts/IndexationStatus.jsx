
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";

import { Layers } from "lucide-react";
import "./IndexationStatus.css";

// Couleurs utilisées dans notre maquette.
const COLORS = {
  indexed: "#138eff",
  remaining: "#b46aff"
};

// Graphique circulaire représentant l'état
// de l'indexation des documents.
function IndexationStatus({
  indexed = null,
  pending = null,
  error = null
}) {

  // Vérifier que les statistiques sont disponibles.
  const hasData =
    [indexed, pending, error].every(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0
    );

  // Calculer le total et le nombre non indexé.
  const total = hasData ? indexed + pending + error : 0;
  const remaining = hasData ? pending + error : 0;

  // Calculer le pourcentage des documents indexés.
  const percentage =
    total > 0
      ? ((indexed / total) * 100).toFixed(1)
      : "0,0";

  // Préparer les données au format attendu par Recharts.
  const chartData = [
    { name: "Indexés", value: indexed ?? 0 },
    { name: "En attente / erreur", value: remaining }
  ];

  return (
    <section className="indexation-chart">

      {/* En-tête du graphique. */}
      <div className="indexation-chart-header">
        <div className="indexation-chart-icon">
          <Layers size={22} />
        </div>

        <h2>Statut de l'indexation</h2>
      </div>

      {/* Afficher le graphique uniquement si les données existent. */}
      {hasData && total > 0 ? (
        <div className="indexation-chart-body">

          <div className="indexation-chart-visual">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={0}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        index === 0
                          ? COLORS.indexed
                          : COLORS.remaining
                      }
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#10243b",
                    border: "1px solid #31567c",
                    borderRadius: "10px",
                    color: "#ffffff"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Pourcentage affiché au centre du donut. */}
            <div className="indexation-chart-center">
              <strong>
                {percentage.replace(".", ",")} %
              </strong>
              <span>Indexés</span>
            </div>

          </div>

          {/* Légende des deux catégories. */}
          <div className="indexation-chart-legend">

            <div className="indexation-legend-item">
              <span className="legend-dot legend-dot--blue" />
              <div>
                <strong>Indexés</strong>
                <p>{indexed} documents</p>
              </div>
            </div>

            <div className="indexation-legend-item">
              <span className="legend-dot legend-dot--purple" />
              <div>
                <strong>En attente / erreur</strong>
                <p>{remaining} documents</p>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="indexation-chart-empty">
          <Layers size={38} />
          <p>Aucune donnée d'indexation disponible.</p>
          <span>
            Le graphique apparaîtra lorsque les statistiques
            documentaires seront disponibles.
          </span>
        </div>
      )}

    </section>
  );
}

export default IndexationStatus;
