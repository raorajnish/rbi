import { Link } from "react-router-dom";

const features = [
  { icon: "🔍", title: "Regulation Monitoring", desc: "Auto-detect new RBI circulars relevant to your organization type." },
  { icon: "⚡", title: "Instant Impact Analysis", desc: "AI maps each new rule to your compliance profile in seconds." },
  { icon: "📋", title: "Action Checklists", desc: "Get prioritized steps to stay compliant before deadlines." },
];

export default function LandingPage() {
  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      background: "var(--background)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 24px 40px",
    }}>

      {/* Hero */}
      <div style={{ textAlign: "center", maxWidth: 620, marginBottom: 56 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 16px",
          borderRadius: 99,
          background: "rgba(27,38,59,0.07)",
          border: "1px solid rgba(27,38,59,0.12)",
          marginBottom: 24,
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-secondary)",
          letterSpacing: "0.3px",
        }}>
          🛡️ AI-Powered RBI Compliance
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 5vw, 52px)",
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1.2,
          marginBottom: 18,
          fontFamily: "var(--font-lora), serif",
          letterSpacing: "-0.5px",
        }}>
          Stay Ahead of Every{" "}
          <span style={{ color: "var(--primary-light)" }}>RBI Regulation</span>
        </h1>

        <p style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: "var(--text-secondary)",
          marginBottom: 36,
          maxWidth: 480,
          margin: "0 auto 36px",
        }}>
          ReguAI monitors RBI circulars 24/7, analyses the impact on your organization,
          and delivers a clear compliance action plan — automatically.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/register"
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              background: "var(--primary)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(27,38,59,0.2)",
              transition: "opacity 0.15s",
            }}
          >
            Register Organization
          </Link>
          <Link
            to="/login"
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              border: "1px solid rgba(27,38,59,0.18)",
              color: "var(--text-primary)",
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
              background: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(8px)",
              transition: "background 0.15s",
            }}
          >
            Organization Login
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        maxWidth: 860,
        width: "100%",
      }}>
        {features.map((f) => (
          <div
            key={f.title}
            style={{
              background: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(27,38,59,0.08)",
              borderRadius: 16,
              padding: "22px 20px",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
