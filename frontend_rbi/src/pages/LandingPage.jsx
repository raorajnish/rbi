import { Link } from "react-router-dom";
import { Shield, Zap, FileSearch, Target, Cpu, Activity, ArrowRight } from "lucide-react";

const features = [
  { icon: <FileSearch size={28} />, title: "Deterministic RAG", desc: "Beyond simple chatbots. Our RAG system is bounded by regulatory states to prevent hallucination drift." },
  { icon: <Zap size={28} />, title: "Zero-Latency Diffusion", desc: "Instant mapping of new RBI circulars to your specific organizational tech-setup and geography." },
  { icon: <Shield size={28} />, title: "Audit Persistence", desc: "Every AI reasoning step is logged in a stateful memory bank, ready for high-stakes regulatory auditing." },
];

const uniqueApproach = [
  { step: "01", title: "Theory of Computation", desc: "We utilize Finite State Machines (FSMs) to tame probabilistic LLMs into deterministic compliance engines." },
  { step: "02", title: "LangGraph Orchestration", desc: "Our 'Veto Nodes' cross-verify AI analysis against original RBI Master Directions in real-time." },
  { step: "03", title: "Actionable Roadmap", desc: "We don't just find gaps; we generate multi-phase remediation plans with Board-ready PDF reports." },
];

export default function LandingPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-fira), sans-serif",
      overflowX: "hidden"
    }}>
      
      {/* Hero Section */}
      <section style={{
        padding: "120px 24px 80px",
        textAlign: "center",
        maxWidth: 1000,
        margin: "0 auto",
        position: "relative"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 20px",
          borderRadius: 99,
          background: "rgba(27,38,59,0.05)",
          border: "1px solid rgba(27,38,59,0.1)",
          color: "var(--primary-light)",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 32,
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          🛡️ Problem Statement 3: Agentic AI for RBI Compliance
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 6vw, 64px)",
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1.1,
          marginBottom: 24,
          fontFamily: "var(--font-lora), serif",
          letterSpacing: "-1px"
        }}>
          Taming the LLM with <br />
          <span style={{ color: "var(--primary-light)", background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Deterministic State Machines</span>
        </h1>

        <p style={{
          fontSize: 18,
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          marginBottom: 44,
          maxWidth: 680,
          margin: "0 auto 44px"
        }}>
          Financial institutions can't afford "probabilistic" compliance. ReguAI uses Finite State Automata to ensure 100% reliable RBI policy adaptation and auditability.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Link to="/register" style={{
            background: "var(--primary)", color: "#fff", padding: "16px 36px", borderRadius: 12,
            textDecoration: "none", fontWeight: 700, fontSize: 16, boxShadow: "0 10px 25px rgba(27,38,59,0.2)",
            display: "flex", alignItems: "center", gap: 8
          }}>
            Get Started <ArrowRight size={18} />
          </Link>
          <Link to="/login" style={{
            background: "#fff", color: "var(--primary)", padding: "16px 36px", borderRadius: 12,
            textDecoration: "none", fontWeight: 600, fontSize: 16, border: "1px solid rgba(27,38,59,0.15)"
          }}>
            Organization Login
          </Link>
        </div>
      </section>

      {/* Unique Approach (FSM Section) */}
      <section style={{
        background: "rgba(255,255,255,0.4)",
        padding: "80px 24px",
        borderTop: "1px solid rgba(27,38,59,0.05)",
        borderBottom: "1px solid rgba(27,38,59,0.05)"
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 32, marginBottom: 50, fontFamily: "var(--font-lora)" }}>The Theory of Computation Edge</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {uniqueApproach.map(item => (
              <div key={item.step} style={{
                background: "#fff", padding: "32px", borderRadius: 20,
                border: "1px solid rgba(27,38,59,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
              }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: "rgba(27,38,59,0.1)", marginBottom: 16 }}>{item.step}</div>
                <h3 style={{ fontSize: 18, marginBottom: 12, color: "var(--primary)" }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 32, marginBottom: 16, fontFamily: "var(--font-lora)" }}>Advanced Agentic Services</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 60 }}>Automating the entire regulatory lifecycle for high-stakes finance.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {features.map(f => (
              <div key={f.title} style={{
                padding: "40px 30px", borderRadius: 24, background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(27,38,59,0.08)", transition: "transform 0.2s"
              }}>
                <div style={{ color: "var(--primary)", marginBottom: 20, display: "flex", justifyContent: "center" }}>{f.icon}</div>
                <h4 style={{ fontSize: 18, marginBottom: 12 }}>{f.title}</h4>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Scope */}
      <section style={{
        background: "var(--primary)", color: "#fff", padding: "80px 24px", textAlign: "center"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, marginBottom: 24, color: "#fff" }}>Real-world Compliance at Scale</h2>
          <p style={{ fontSize: 16, opacity: 0.8, lineHeight: 1.7, marginBottom: 40 }}>
            Our mission is to eliminate regulatory friction. Future iterations include a "Self-Healing Policy" engine that automatically drafts board resolutions and updates internal operating procedures in response to circular IDs.
          </p>
          <div style={{ display: "inline-flex", gap: 24, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            <span>✓ NBFC Ready</span>
            <span>✓ PA/PG Compliant</span>
            <span>✓ Commercial Banking Optimized</span>
          </div>
        </div>
      </section>

      <footer style={{ padding: "40px 24px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
        © 2026 ReguAI - RBI Pilot Hackathon Project
      </footer>
    </div>
  );
}
