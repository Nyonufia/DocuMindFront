
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

// Ce composant reçoit les données du graphique
// depuis le tableau de bord administrateur.
function DocumentsEvolution({ data = [] }) {

  // Vérifier si des données existent avant
  // d'essayer de dessiner le graphique.
  const hasData = data.length > 0;

  return (
    <section className="documents-chart">

      {/* En-tête du graphique. */}
      <div className="documents-chart-header">
        <div className="documents-chart-icon">
          <ChartNoAxesCombined size={22} />
        </div>

        <h2>Évolution des documents</h2>
        <span>(30 derniers jours)</span>
      </div>

      {/* Afficher un graphique ou un état vide. */}
      {hasData ? (
        <div className="documents-chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 15,
                right: 15,
                left: 0,
                bottom: 5
              }}
            >
              {/* Lignes horizontales du graphique. */}
              <CartesianGrid
                stroke="#24415f"
                vertical={false}
              />

              {/* Axe horizontal : dates. */}
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fill: "#cbd5e1", fontSize: 12 }}
                tickLine={false}
              />

              {/* Axe vertical : nombre de documents. */}
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: "#cbd5e1", fontSize: 12 }}
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
                formatter={(value) => [value, "Documents"]}
              />

              {/* Courbe principale. */}
              <Line
                type="monotone"
                dataKey="total"
                name="Documents"
                stroke="#16a6ff"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#16a6ff",
                  stroke: "#ffffff",
                  strokeWidth: 2
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="documents-chart-empty">
          <ChartNoAxesCombined size={38} />
          <p>Aucune donnée disponible pour le moment.</p>
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
