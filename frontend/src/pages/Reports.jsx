import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function Reports() {
  const [efficiency, setEfficiency] = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [cost, setCost] = useState([]);
  const [roi, setRoi] = useState([]);

  useEffect(() => {
    api.get("/reports/fuel-efficiency").then((r) => setEfficiency(r.data.data));
    api.get("/reports/utilization").then((r) => setUtilization(r.data.data));
    api.get("/reports/operational-cost").then((r) => setCost(r.data.data));
    api.get("/reports/roi").then((r) => setRoi(r.data.data));
  }, []);

  async function handleExport() {
    const res = await api.get("/reports/export.csv", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transitops_cost_roi_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

const costChartData = {
  labels: cost.map(
    (v) => `${v.registration_number}`
  ),
  datasets: [
    {
      label: "Operational Cost (₹)",
      data: cost.map((v) => Number(v.operational_cost)),
      backgroundColor: "#2563eb",
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
  },
};

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Reports & Analytics</h1>
        <button onClick={handleExport} style={btnStyle}>Export CSV</button>
      </div>

      <h3 style={{ marginTop: 24 }}>Fuel Efficiency</h3>
      <table style={tableStyle}>
        <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
          <th style={thStyle}>Vehicle</th><th style={thStyle}>Total Distance</th><th style={thStyle}>Total Fuel</th><th style={thStyle}>km/L</th>
        </tr></thead>
        <tbody>
          {efficiency.map((r) => (
            <tr key={r.vehicle_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{r.name} ({r.registration_number})</td>
              <td style={tdStyle}>{r.total_distance} km</td>
              <td style={tdStyle}>{r.total_fuel} L</td>
              <td style={tdStyle}>{r.km_per_liter ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 24 }}>Fleet Utilization by Type</h3>
      <table style={tableStyle}>
        <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
          <th style={thStyle}>Type</th><th style={thStyle}>Utilization %</th>
        </tr></thead>
        <tbody>
          {utilization.map((r) => (
            <tr key={r.type} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{r.type}</td>
              <td style={tdStyle}>{r.utilization_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
<div
  style={{
    background: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 30,
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
  }}
>
  <h2 style={{ marginBottom: 20 }}>
    Operational Cost Analytics
  </h2>

  <Bar
    data={costChartData}
    options={chartOptions}
  />
</div>
      <h3 style={{ marginTop: 24 }}>Operational Cost</h3>
      <table style={tableStyle}>
        <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
          <th style={thStyle}>Vehicle</th><th style={thStyle}>Fuel</th><th style={thStyle}>Maintenance</th><th style={thStyle}>Expenses</th><th style={thStyle}>Total</th>
        </tr></thead>
        <tbody>
          {cost.map((r) => (
            <tr key={r.vehicle_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{r.name} ({r.registration_number})</td>
              <td style={tdStyle}>₹{r.fuel_total}</td>
              <td style={tdStyle}>₹{r.maintenance_total}</td>
              <td style={tdStyle}>₹{r.expense_total}</td>
              <td style={tdStyle}><strong>₹{r.operational_cost}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 24 }}>Vehicle ROI</h3>
      <table style={tableStyle}>
        <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
          <th style={thStyle}>Vehicle</th><th style={thStyle}>ROI %</th>
        </tr></thead>
        <tbody>
          {roi.map((r) => (
            <tr key={r.vehicle_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{r.name} ({r.registration_number})</td>
              <td style={{ ...tdStyle, color: r.roi_pct >= 0 ? "#15803D" : "#B91C1C", fontWeight: 600 }}>{r.roi_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

const btnStyle = { padding: "10px 16px", background: "#1f2937", color: "white", border: "none", borderRadius: 6, cursor: "pointer" };
const tableStyle = { width: "100%", background: "white", borderRadius: 10, marginTop: 8, borderCollapse: "collapse" };
const thStyle = { padding: 12, fontSize: 13, color: "#6b7280" };
const tdStyle = { padding: 12 };
