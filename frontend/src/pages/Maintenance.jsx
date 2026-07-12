import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicle_id: "", description: "", cost: "" });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const [logsRes, vehiclesRes] = await Promise.all([api.get("/maintenance"), api.get("/vehicles")]);
    setLogs(logsRes.data.data);
    setVehicles(vehiclesRes.data.data);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.vehicle_id || !form.description) {
      setError("Vehicle and description are required");
      return;
    }
    try {
      await api.post("/maintenance", { ...form, vehicle_id: Number(form.vehicle_id), cost: Number(form.cost) || 0 });
      setForm({ vehicle_id: "", description: "", cost: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create maintenance log");
    }
  }

  async function handleClose(id) {
    try {
      await api.put(`/maintenance/${id}/close`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to close maintenance log");
    }
  }

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Maintenance</h1>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>
          {showForm ? "Cancel" : "+ New Maintenance Log"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          <div style={rowStyle}>
            <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} style={inputStyle}>
              <option value="">Select Vehicle</option>
              {vehicles.filter(v => v.status !== 'Retired').map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.registration_number}) - {v.status}</option>
              ))}
            </select>
            <input placeholder="Description (e.g. Oil change)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
            <input type="number" placeholder="Cost" value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })} style={inputStyle} />
          </div>
          <p style={{ fontSize: 12, color: "#6b7280" }}>A vehicle currently On Trip cannot be sent to maintenance — the backend will reject it.</p>
          <button type="submit" style={btnStyle}>Save Log</button>
        </form>
      )}

      <table style={tableStyle}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
            <th style={thStyle}>Vehicle</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Cost</th>
            <th style={thStyle}>Start</th>
            <th style={thStyle}>End</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr><td colSpan={7} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>No maintenance logs yet</td></tr>
          )}
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{log.vehicle_name} ({log.registration_number})</td>
              <td style={tdStyle}>{log.description}</td>
              <td style={tdStyle}>₹{log.cost}</td>
              <td style={tdStyle}>{log.start_date}</td>
              <td style={tdStyle}>{log.end_date || "-"}</td>
              <td style={tdStyle}>
                <span style={{ color: log.status === "Open" ? "#B45309" : "#15803D", fontWeight: 600 }}>{log.status}</span>
              </td>
              <td style={tdStyle}>
                {log.status === "Open" && <button onClick={() => handleClose(log.id)} style={smallBtnStyle}>Close</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

const btnStyle = { padding: "10px 16px", background: "#1f2937", color: "white", border: "none", borderRadius: 6, cursor: "pointer" };
const smallBtnStyle = { padding: "6px 10px", background: "#1f2937", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 };
const formStyle = { background: "white", padding: 20, borderRadius: 10, marginTop: 16, marginBottom: 16 };
const rowStyle = { display: "flex", gap: 12, marginBottom: 12 };
const inputStyle = { flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 6 };
const tableStyle = { width: "100%", background: "white", borderRadius: 10, marginTop: 16, borderCollapse: "collapse" };
const thStyle = { padding: 12, fontSize: 13, color: "#6b7280" };
const tdStyle = { padding: 12 };
