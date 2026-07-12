import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

const STATUS_COLORS = { Draft: "#6B7280", Dispatched: "#B45309", Completed: "#15803D", Cancelled: "#B91C1C" };

function Badge({ status }) {
  return (
    <span style={{ color: "white", background: STATUS_COLORS[status] || "#6B7280", padding: "3px 10px", borderRadius: 999, fontSize: 12 }}>
      {status}
    </span>
  );
}

const emptyForm = { source: "", destination: "", vehicle_id: "", driver_id: "", cargo_weight: "", planned_distance: "", revenue: "" };

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null); // {type: 'success'|'error', message}
  const [showForm, setShowForm] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [completeForm, setCompleteForm] = useState({ actual_distance: "", fuel_consumed: "" });

  async function loadAll() {
    const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
      api.get("/trips"),
      api.get("/vehicles/available"),
      api.get("/drivers/available"),
    ]);
    setTrips(tripsRes.data.data);
    setVehicles(vehiclesRes.data.data);
    setDrivers(driversRes.data.data);
  }

  useEffect(() => { loadAll(); }, []);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.source || !form.destination || !form.vehicle_id || !form.driver_id || !form.cargo_weight || !form.planned_distance) {
      setError("All fields except revenue are required");
      return;
    }
    try {
      await api.post("/trips", {
        ...form,
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight: Number(form.cargo_weight),
        planned_distance: Number(form.planned_distance),
        revenue: Number(form.revenue) || 0,
      });
      setForm(emptyForm);
      setShowForm(false);
      showToast("success", "Trip created as Draft");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create trip");
    }
  }

  async function handleDispatch(id) {
    try {
      await api.put(`/trips/${id}/dispatch`);
      showToast("success", "Trip dispatched");
      loadAll();
    } catch (err) {
      showToast("error", err.response?.data?.error || "Dispatch failed");
    }
  }

  async function handleCancel(id) {
    try {
      await api.put(`/trips/${id}/cancel`);
      showToast("success", "Trip cancelled");
      loadAll();
    } catch (err) {
      showToast("error", err.response?.data?.error || "Cancel failed");
    }
  }

  async function handleComplete(id) {
    if (!completeForm.actual_distance || !completeForm.fuel_consumed) {
      showToast("error", "Actual distance and fuel consumed are required");
      return;
    }
    try {
      await api.put(`/trips/${id}/complete`, {
        actual_distance: Number(completeForm.actual_distance),
        fuel_consumed: Number(completeForm.fuel_consumed),
      });
      setCompletingId(null);
      setCompleteForm({ actual_distance: "", fuel_consumed: "" });
      showToast("success", "Trip completed");
      loadAll();
    } catch (err) {
      showToast("error", err.response?.data?.error || "Complete failed");
    }
  }

  return (
    <DashboardLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Trips</h1>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>
          {showForm ? "Cancel" : "+ New Trip"}
        </button>
      </div>

      {toast && (
        <div style={{
          padding: 12, borderRadius: 6, marginTop: 12,
          background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
          color: toast.type === "success" ? "#15803D" : "#B91C1C",
        }}>
          {toast.message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          <div style={rowStyle}>
            <input placeholder="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={inputStyle} />
            <input placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} style={inputStyle} />
          </div>
          <div style={rowStyle}>
            <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} style={inputStyle}>
              <option value="">Select Vehicle (Available only)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.registration_number}) - {v.max_load_capacity}kg max</option>
              ))}
            </select>
            <select value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} style={inputStyle}>
              <option value="">Select Driver (Available only)</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} - license valid until {d.license_expiry_date}</option>
              ))}
            </select>
          </div>
          <div style={rowStyle}>
            <input type="number" placeholder="Cargo Weight (kg)" value={form.cargo_weight} onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })} style={inputStyle} />
            <input type="number" placeholder="Planned Distance (km)" value={form.planned_distance} onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} style={inputStyle} />
            <input type="number" placeholder="Revenue" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} style={inputStyle} />
          </div>
          <p style={{ fontSize: 12, color: "#6b7280" }}>
            Only Available vehicles and drivers with valid, non-suspended status appear above — this is the dispatch pool enforced by the backend.
          </p>
          <button type="submit" style={btnStyle}>Create Trip (Draft)</button>
        </form>
      )}

      <table style={tableStyle}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
            <th style={thStyle}>Route</th>
            <th style={thStyle}>Vehicle</th>
            <th style={thStyle}>Driver</th>
            <th style={thStyle}>Cargo</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>No trips yet</td></tr>
          )}
          {trips.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{t.source} → {t.destination}</td>
              <td style={tdStyle}>{t.vehicle_name}</td>
              <td style={tdStyle}>{t.driver_name}</td>
              <td style={tdStyle}>{t.cargo_weight} kg</td>
              <td style={tdStyle}><Badge status={t.status} /></td>
              <td style={tdStyle}>
                {t.status === "Draft" && (
                  <button onClick={() => handleDispatch(t.id)} style={smallBtnStyle}>Dispatch</button>
                )}
                {t.status === "Dispatched" && completingId !== t.id && (
                  <>
                    <button onClick={() => setCompletingId(t.id)} style={smallBtnStyle}>Complete</button>
                    <button onClick={() => handleCancel(t.id)} style={{ ...smallBtnStyle, background: "#B91C1C", marginLeft: 6 }}>Cancel</button>
                  </>
                )}
                {completingId === t.id && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="number" placeholder="km" value={completeForm.actual_distance}
                      onChange={(e) => setCompleteForm({ ...completeForm, actual_distance: e.target.value })}
                      style={{ width: 60, padding: 4 }} />
                    <input type="number" placeholder="liters" value={completeForm.fuel_consumed}
                      onChange={(e) => setCompleteForm({ ...completeForm, fuel_consumed: e.target.value })}
                      style={{ width: 60, padding: 4 }} />
                    <button onClick={() => handleComplete(t.id)} style={smallBtnStyle}>Confirm</button>
                  </div>
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
const smallBtnStyle = { padding: "6px 10px", background: "#1f2937", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 };
const formStyle = { background: "white", padding: 20, borderRadius: 10, marginTop: 16, marginBottom: 16 };
const rowStyle = { display: "flex", gap: 12, marginBottom: 12 };
const inputStyle = { flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 6 };
const tableStyle = { width: "100%", background: "white", borderRadius: 10, marginTop: 16, borderCollapse: "collapse" };
const thStyle = { padding: 12, fontSize: 13, color: "#6b7280" };
const tdStyle = { padding: 12 };
