import { Link, useLocation } from "react-router-dom";

const menu = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Vehicles", path: "/vehicles" },
  { name: "Drivers", path: "/drivers" },
  { name: "Trips", path: "/trips" },
  { name: "Maintenance", path: "/maintenance" },
  { name: "Fuel", path: "/fuel" },
  { name: "Reports", path: "/reports" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div
      style={{
        width: 230,
        background: "#1f2937",
        color: "white",
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <h2 style={{ marginBottom: 30 }}>TransitOps</h2>

      {menu.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            display: "block",
            padding: "12px",
            marginBottom: "8px",
            borderRadius: 8,
            background:
              location.pathname === item.path ? "#2563eb" : "transparent",
          }}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}