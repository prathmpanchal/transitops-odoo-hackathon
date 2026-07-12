import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Fleet Manager", email: "fleet@transitops.com" },
  { label: "Driver", email: "driver@transitops.com" },
  { label: "Safety Officer", email: "safety@transitops.com" },
  { label: "Financial Analyst", email: "finance@transitops.com" },
];

export default function Login() {
  const [email, setEmail] = useState("fleet@transitops.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 40,
          borderRadius: 12,
          boxShadow: "0 2px 20px rgba(0,0,0,.1)",
          width: 380,
        }}
      >
        <h1 style={{ marginBottom: 6 }}>TransitOps</h1>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>Smart Transport Operations Platform</p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 16, border: "1px solid #d1d5db", borderRadius: 6 }}
          />

          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 16, border: "1px solid #d1d5db", borderRadius: 6 }}
          />

          {error && <p style={{ color: "#dc2626", marginBottom: 16, fontSize: 14 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              background: "#1f2937",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Demo accounts (password: demo1234)</p>
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => setEmail(acc.email)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                marginBottom: 4,
                fontSize: 13,
                background: email === acc.email ? "#e5e7eb" : "transparent",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {acc.label} — {acc.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
