import DashboardLayout from "../layouts/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <h1>Dashboard</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 20,
          marginTop: 25,
        }}
      >
        {[
          "Vehicles",
          "Drivers",
          "Trips",
          "Maintenance",
        ].map((card) => (
          <div
            key={card}
            style={{
              background: "white",
              padding: 25,
              borderRadius: 10,
              boxShadow: "0 2px 10px rgba(0,0,0,.1)",
            }}
          >
            <h3>{card}</h3>
            <h1>0</h1>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}