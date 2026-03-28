<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Simulation Capital / Gains</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; }
    canvas { max-width: 900px; max-height: 500px; }
    input { margin: 5px; width: 80px; }
    table { border-collapse: collapse; margin-top: 20px; width: 95%; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h2>Simulation Capital et Gains Mensuels</h2>

  <label>Capital initial (€): <input type="number" id="capital" value="1000"></label>
  <label>APR (%): <input type="number" id="apr" value="17.56"></label>
  <label>Versement mensuel (€): <input type="number" id="versement" value="0"></label>
  <label>Nombre de mois: <input type="number" id="nbMois" value="12"></label>
  <label><input type="checkbox" id="reinvestir" checked> Réinvestir les gains</label>
  <button onclick="simuler()">Simuler</button>

  <canvas id="graph"></canvas>

  <table id="tableau">
    <thead>
      <tr>
        <th>Mois</th>
        <th>Capital cumulé (€)</th>
        <th>Gain mensuel (€)</th>
        <th>Gain journalier (€)</th>
        <th>Gain cumulé (€)</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <script>
    let chart;

    function simuler() {
      const P = parseFloat(document.getElementById("capital").value);
      const APR = parseFloat(document.getElementById("apr").value) / 100;
      const C = parseFloat(document.getElementById("versement").value);
      const nbMois = parseInt(document.getElementById("nbMois").value);
      const reinvestir = document.getElementById("reinvestir").checked;
      const r = APR / 12; // taux mensuel

      let capital = P;
      let capitalData = [];
      let gainData = [];
      let moisLabels = [];
      let gainCumul = 0;

      const tbody = document.querySelector("#tableau tbody");
      tbody.innerHTML = "";

      for (let i = 1; i <= nbMois; i++) {
        let gain = capital * r;
        gainCumul += gain;

        if (reinvestir) {
          capital += gain;
        }
        capital += C;

        capitalData.push(capital.toFixed(2));
        gainData.push(gain.toFixed(2));
        moisLabels.push("Mois " + i);

        const gainJour = (gain / 30).toFixed(2); // approximatif 30 jours

        // Ajouter ligne au tableau
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>Mois ${i}</td>
                        <td>${capital.toFixed(2)}</td>
                        <td>${gain.toFixed(2)}</td>
                        <td>${gainJour}</td>
                        <td>${gainCumul.toFixed(2)}</td>`;
        tbody.appendChild(tr);
      }

      const data = {
        labels: moisLabels,
        datasets: [
          {
            label: "Capital cumulé (€)",
            data: capitalData,
            borderColor: "blue",
            backgroundColor: "rgba(0,0,255,0.1)",
            fill: true,
            tension: 0.3
          },
          {
            label: "Gain mensuel (€)",
            data: gainData,
            borderColor: "green",
            backgroundColor: "rgba(0,255,0,0.1)",
            fill: true,
            tension: 0.3
          }
        ]
      };

      const config = {
        type: "line",
        data: data,
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Simulation Capital et Gains" },
            tooltip: { mode: "index", intersect: false }
          },
          interaction: { mode: "nearest", axis: "x", intersect: false },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "€" } },
            x: { title: { display: true, text: "Mois" } }
          }
        }
      };

      if(chart) chart.destroy();
      const ctx = document.getElementById("graph").getContext("2d");
      chart = new Chart(ctx, config);
    }

    simuler();
  </script>
</body>
</html>