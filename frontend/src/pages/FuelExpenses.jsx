import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

export default function FuelExpenses() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuelForm, setFuelForm] = useState({ vehicle_id: "", liters: "", cost: "", date: "" });
  const [expenseForm, setExpenseForm] = useState({ vehicle_id: "", type: "", amount: "", date: "" });
  const [error, setError] = useState("");

  async function load() {
    const [fuelRes, expRes, vehRes] = await Promise.all([
      api.get("/fuel-logs"), api.get("/expenses"), api.get("/vehicles"),
    ]);
    setFuelLogs(fuelRes.data.data);
    setExpenses(expRes.data.data);
    setVehicles(vehRes.data.data);
  }

  useEffect(() => { load(); }, []);

  async function handleFuelSubmit(e) {
    e.preventDefault();
    setError("");
    if (!fuelForm.vehicle_id || !fuelForm.liters || !fuelForm.cost) {
      setError("Vehicle, liters, and cost are required for fuel logs");
      return;
    }
    try {
      await api.post("/fuel-logs", { ...fuelForm, vehicle_id: Number(fuelForm.vehicle_id), liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) });
      setFuelForm({ vehicle_id: "", liters: "", cost: "", date: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add fuel log");
    }
  }

  async function handleExpenseSubmit(e) {
    e.preventDefault();
    setError("");
    if (!expenseForm.vehicle_id || !expenseForm.type || !expenseForm.amount) {
      setError("Vehicle, type, and amount are required for expenses");
      return;
    }
    try {
      await api.post("/expenses", { ...expenseForm, vehicle_id: Number(expenseForm.vehicle_id), amount: Number(expenseForm.amount) });
      setExpenseForm({ vehicle_id: "", type: "", amount: "", date: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add expense");
    }
  }

  return (
    <DashboardLayout>
      <h1>Fuel & Expenses</h1>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <h3 style={{ marginTop: 24 }}>Fuel Logs</h3>
      <form onSubmit={handleFuelSubmit} style={formStyle}>
        <div style={rowStyle}>
          <select value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })} style={inputStyle}>
            <option value="">Select Vehicle</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.registration_number})</option>)}
          </select>
          <input type="number" placeholder="Liters" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} style={inputStyle} />
          <input type="number" placeholder="Cost" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} style={inputStyle} />
          <input type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} style={inputStyle} />
          <button type="submit" style={btnStyle}>Add</button>
        </div>
      </form>
      <table style={tableStyle}>
        <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
          <th style={thStyle}>Vehicle</th><th style={thStyle}>Liters</th><th style={thStyle}>Cost</th><th style={thStyle}>Date</th>
        </tr></thead>
        <tbody>
          {fuelLogs.length === 0 && <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>No fuel logs yet</td></tr>}
          {fuelLogs.map((f) => (
            <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{f.vehicle_name} ({f.registration_number})</td>
              <td style={tdStyle}>{f.liters} L</td>
              <td style={tdStyle}>₹{f.cost}</td>
              <td style={tdStyle}>{f.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 32 }}>Expenses</h3>
      <form onSubmit={handleExpenseSubmit} style={formStyle}>
        <div style={rowStyle}>
          <select value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })} style={inputStyle}>
            <option value="">Select Vehicle</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.registration_number})</option>)}
          </select>
          <input placeholder="Type (e.g. Toll, Parking)" value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })} style={inputStyle} />
          <input type="number" placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} style={inputStyle} />
          <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} style={inputStyle} />
          <button type="submit" style={btnStyle}>Add</button>
        </div>
      </form>
      <table style={tableStyle}>
        <thead><tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
          <th style={thStyle}>Vehicle</th><th style={thStyle}>Type</th><th style={thStyle}>Amount</th><th style={thStyle}>Date</th>
        </tr></thead>
        <tbody>
          {expenses.length === 0 && <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>No expenses yet</td></tr>}
          {expenses.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={tdStyle}>{e.vehicle_name} ({e.registration_number})</td>
              <td style={tdStyle}>{e.type}</td>
              <td style={tdStyle}>₹{e.amount}</td>
              <td style={tdStyle}>{e.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

const btnStyle = { padding: "10px 16px", background: "#1f2937", color: "white", border: "none", borderRadius: 6, cursor: "pointer" };
const formStyle = { background: "white", padding: 16, borderRadius: 10, marginTop: 12, marginBottom: 12 };
const rowStyle = { display: "flex", gap: 12, alignItems: "center" };
const inputStyle = { flex: 1, padding: 10, border: "1px solid #d1d5db", borderRadius: 6 };
const tableStyle = { width: "100%", background: "white", borderRadius: 10, borderCollapse: "collapse" };
const thStyle = { padding: 12, fontSize: 13, color: "#6b7280" };
const tdStyle = { padding: 12 };
