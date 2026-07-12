import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: 22,
        borderRadius: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,.08)",
      }}
    >
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 6 }}>{label}</p>
      <h2 style={{ margin: 0, fontSize: 28 }}>{value}</h2>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  async function loadStats() {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load dashboard");
    }
  }

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // poll every 10s for "live" data
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <h1>Dashboard</h1>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {!stats ? (
        <p>Loading...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            marginTop: 25,
          }}
        >
          <StatCard label="Active Vehicles" value={stats.active_vehicles} />
          <StatCard label="Available" value={stats.available_vehicles} />
          <StatCard label="In Maintenance" value={stats.in_maintenance} />
          <StatCard label="Active Trips" value={stats.active_trips} />
          <StatCard label="Pending Trips" value={stats.pending_trips} />
          <StatCard label="Drivers On Duty" value={stats.drivers_on_duty} />
          <StatCard label="Fleet Utilization" value={`${stats.fleet_utilization_pct}%`} />
        </div>
      )}
    </DashboardLayout>
  );
}
