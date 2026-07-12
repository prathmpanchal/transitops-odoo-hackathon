import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: 30,
          background: "#f3f4f6",
        }}
      >
        {children}
      </div>
    </div>
  );
}