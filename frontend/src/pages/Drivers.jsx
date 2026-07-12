import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

const STATUS_COLORS = { Available: "#15803D", "On Trip": "#B45309", "Off Duty": "#6B7280", Suspended: "#B91C1C" };

function Badge({ status }) {
  return (
    <span style={{ color: "white", background: STATUS_COLORS[status] || "#6B7280", padding: "3px 10px", borderRadius: 999, fontSize: 12 }}>
      {status}
    </span>
  );
}

function isExpired(dateStr) {
  return dateStr < new Date().toISOString().slice(0, 10);
}

const emptyForm = { name: "", license_number: "", license_category: "LMV", license_expiry_date: "", contact_number: "", safety_score: 100 };

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await api.get("/drivers");
    setDrivers(res.data.data);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.license_number || !form.license_expiry_date || !form.contact_number) {
      setError("Name, license number, expiry date, and contact number are required");
      return;
    }
    try {
      await api.post("/drivers", { ...form, safety_score: Number(form.safety_score) });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create driver");
    }
  }

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Drivers</h1>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>
          {showForm ? "Cancel" : "+ Add Driver"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          <div style={rowStyle}>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            <input placeholder="License Number" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} style={inputStyle} />
            <select value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} style={inputStyle}>
              <option>LMV</option><option>HMV</option>
            </select>
          </div>
          <div style={rowStyle}>
            <input type="date" placeholder="License Expiry" value={form.license_expiry_date} onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })} style={inputStyle} />
            <input placeholder="Contact Number" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} style={inputStyle} />
            <input type="number" placeholder="Safety Score" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} style={inputStyle} />
          </div>
          <button type="submit" style={btnStyle}>Save Driver</button>
        </form>
      )}

      <table style={tableStyle}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>License No</th>
            <th style={thStyle}>Expiry</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Safety Score</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {drivers.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>No drivers yet</td></tr>
          )}
          {drivers.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{d.name}</td>
              <td style={tdStyle}>{d.license_number}</td>
              <td style={{ ...tdStyle, color: isExpired(d.license_expiry_date) ? "#dc2626" : "inherit", fontWeight: isExpired(d.license_expiry_date) ? 600 : 400 }}>
                {d.license_expiry_date}{isExpired(d.license_expiry_date) ? " (expired)" : ""}
              </td>
              <td style={tdStyle}>{d.license_category}</td>
              <td style={tdStyle}>{d.safety_score}</td>
              <td style={tdStyle}><Badge status={d.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

const btnStyle = { padding: "10px 16px", background: "#1f2937", color: "white", border: "none", borderRadius: 6, cursor: "pointer" };
const formStyle = { background: "white", padding: 20, borderRadius: 10, marginTop: 16, marginBottom: 16 };
const rowStyle = { display: "flex", gap: 12, marginBottom: 12 };
const inputStyle = { flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 6 };
const tableStyle = { width: "100%", background: "white", borderRadius: 10, marginTop: 16, borderCollapse: "collapse" };
const thStyle = { padding: 12, fontSize: 13, color: "#6b7280" };
const tdStyle = { padding: 12 };
