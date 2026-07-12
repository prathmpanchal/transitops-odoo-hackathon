import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

function Placeholder({ title }) {
  return <h1 style={{ padding: 40 }}>{title}</h1>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder title="Login" />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/vehicles" element={<Placeholder title="Vehicles" />} />

      <Route path="/drivers" element={<Placeholder title="Drivers" />} />

      <Route path="/trips" element={<Placeholder title="Trips" />} />

      <Route
        path="/maintenance"
        element={<Placeholder title="Maintenance" />}
      />

      <Route path="/fuel" element={<Placeholder title="Fuel & Expenses" />} />

      <Route path="/reports" element={<Placeholder title="Reports" />} />
    </Routes>
  );
}