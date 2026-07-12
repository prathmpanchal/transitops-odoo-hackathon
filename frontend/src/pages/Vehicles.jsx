import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

const STATUS_COLORS = {
  Available: "#15803D",
  "On Trip": "#B45309",
  "In Shop": "#B91C1C",
  Retired: "#6B7280",
};

function Badge({ status }) {
  return (
    <span
      style={{
        color: "white",
        background: STATUS_COLORS[status] || "#6B7280",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
      }}
    >
      {status}
    </span>
  );
}

const emptyForm = { registration_number: "", name: "", type: "Van", max_load_capacity: "", acquisition_cost: "", region: "" };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await api.get("/vehicles");
    setVehicles(res.data.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.registration_number || !form.name || !form.max_load_capacity || !form.acquisition_cost) {
      setError("Registration number, name, capacity, and cost are required");
      return;
    }
    try {
      await api.post("/vehicles", {
        ...form,
        max_load_capacity: Number(form.max_load_capacity),
        acquisition_cost: Number(form.acquisition_cost),
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create vehicle");
    }
  }

async function handleDelete(id) {
  if (!window.confirm("Retire this vehicle?")) return;

  try {
    await api.delete(`/vehicles/${id}`);
    load();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to retire vehicle");
  }
}

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Vehicles</h1>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>
          {showForm ? "Cancel" : "+ Add Vehicle"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          <div style={rowStyle}>
            <input placeholder="Registration Number" value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })} style={inputStyle} />
            <input placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              <option>Van</option><option>Truck</option><option>Bike</option><option>Car</option>
            </select>
          </div>
          <div style={rowStyle}>
            <input placeholder="Max Load Capacity (kg)" type="number" value={form.max_load_capacity}
              onChange={(e) => setForm({ ...form, max_load_capacity: e.target.value })} style={inputStyle} />
            <input placeholder="Acquisition Cost" type="number" value={form.acquisition_cost}
              onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} style={inputStyle} />
            <input placeholder="Region" value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })} style={inputStyle} />
          </div>
          <button type="submit" style={btnStyle}>Save Vehicle</button>
        </form>
      )}

      <table style={tableStyle}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
            <th style={thStyle}>Reg No</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Capacity</th>
            <th style={thStyle}>Odometer</th>
            <th style={thStyle}>Region</th>
            <th style={thStyle}>Status</th>
	    <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length === 0 && (
            <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>No vehicles yet</td></tr>
          )}
          {vehicles.map((v) => (
            <tr key={v.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{v.registration_number}</td>
              <td style={tdStyle}>{v.name}</td>
              <td style={tdStyle}>{v.type}</td>
              <td style={tdStyle}>{v.max_load_capacity} kg</td>
              <td style={tdStyle}>{v.odometer} km</td>
              <td style={tdStyle}>{v.region || "-"}</td>
              <td style={tdStyle}>
  <Badge status={v.status} />
</td>

<td style={tdStyle}>
  {v.status !== "Retired" && (
    <button
      onClick={() => handleDelete(v.id)}
      style={{
        background: "#dc2626",
        color: "white",
        border: "none",
        padding: "6px 12px",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      Retire
    </button>
  )}
</td>
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
