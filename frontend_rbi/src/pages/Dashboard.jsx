import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import {
  BarChart3,
  LogOut,
  Menu,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  LayoutDashboard,
  FileText,
  CheckSquare,
  PieChart,
  User,
  Save,
  Edit2,
  Building2,
  ShieldCheck,
  Clock,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile states
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Regulations state
  const [regulations, setRegulations] = useState([]);
  const [loadingRegulations, setLoadingRegulations] = useState(false);

  // Compliance AI Chat state
  const [chatMessages, setChatMessages] = useState([{ role: "ai", content: "Hello! I am your Compliance AI Agent. Upload your organizational documents or ask me questions about RBI guidelines, rule violations, and risk analysis." }]);
  const [chatInput, setChatInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch profile when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          setLoadingProfile(false);
          return;
        }
        const response = await api.get("users/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
        setFormData(response.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setProfileError(err?.response?.data?.detail || "Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Compliance data (will later come from backend)
  const complianceItems = [
    { label: "KYC Compliance", score: 92 },
    { label: "AML Compliance", score: 70 },
    { label: "Data Localization", score: 60 },
    { label: "Risk Management", score: 85 },
  ];

  // Fetch regulations when that tab is opened
  useEffect(() => {
    if (activeTab === "regulations" && regulations.length === 0) {
      const fetchRegs = async () => {
        setLoadingRegulations(true);
        try {
          const token = localStorage.getItem("access");
          const response = await api.get("regulations/", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRegulations(response.data.notifications || []);
        } catch (err) {
          console.error("Error fetching regulations:", err);
        } finally {
          setLoadingRegulations(false);
        }
      };
      fetchRegs();
    }
  }, [activeTab, regulations.length]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() && attachedFiles.length === 0) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg || "Please analyze the attached documents." }]);
    setIsChatLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", userMsg || "Please analyze the attached documents.");
      if (attachedFiles.length > 0) {
        formData.append("file", attachedFiles[0]);
      }

      const token = localStorage.getItem("access");
      const response = await api.post("compliance/chat/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setChatMessages(prev => [...prev, { role: "ai", content: response.data.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: "ai", content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) { setProfileError("No authentication token found"); return; }

      const response = await api.put("users/profile/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(response.data.user);
      setFormData(response.data.user);
      setIsEditing(false);
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err) {
      setProfileError(err?.response?.data?.detail || "Failed to update profile");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "regulations", label: "Regulations", icon: FileText },
    { id: "compliance", label: "Compliance AI", icon: ShieldCheck },
    { id: "reports", label: "Reports", icon: PieChart },
    { id: "profile", label: "Profile", icon: User },
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Good";
    if (score >= 60) return "Moderate";
    return "At Risk";
  };

  const avgScore = Math.round(
    complianceItems.reduce((a, b) => a + b.score, 0) / complianceItems.length
  );

  const displayName = profile?.company_name || user?.company_name || user?.username || "—";

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--background)", fontFamily: "var(--font-gothic), sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        position: "fixed",
        left: sidebarOpen ? 0 : undefined,
        width: 240,
        height: "100%",
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(var(--color-border), 0.4)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        transition: "transform 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(27,38,59,0.1)" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.3px" }}>
            🛡️ ReguAI
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Compliance Dashboard
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: 4,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "rgba(27,38,59,0.08)" : "transparent",
                  color: active ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(27,38,59,0.05)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(27,38,59,0.1)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.05)",
              color: "#EF4444",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: 240, overflow: "hidden" }}>

        {/* Top bar */}
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          height: 60,
          background: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(27,38,59,0.08)",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{profile?.organization_type || user?.username}</span>
            <div style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: "var(--primary)",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600,
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px" }}>

          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Welcome glass card */}
              <div style={{
                padding: "28px 32px",
                borderRadius: 16,
                background: "rgba(27,38,59,0.07)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(27,38,59,0.1)",
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  Welcome back, {displayName} 👋
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {profile?.organization_type
                    ? `${profile.organization_type} · Stay compliant with the latest RBI regulations`
                    : "Stay compliant with the latest RBI regulations"}
                </div>
              </div>

              {/* Stat chips */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Active Regulations", value: "24", icon: FileText, color: "var(--primary)" },
                  { label: "Overall Compliance", value: `${avgScore}%`, icon: ShieldCheck, color: "#10B981" },
                  { label: "Pending Actions", value: "3", icon: Clock, color: "#F59E0B" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} style={{
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(27,38,59,0.08)",
                    borderRadius: 14,
                    padding: "20px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${color}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={20} color={color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compliance score cards */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Activity size={16} />
                  Compliance Scores
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                  {complianceItems.map((item) => {
                    const color = getScoreColor(item.score);
                    return (
                      <div key={item.label} style={{
                        background: "rgba(255,255,255,0.6)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(27,38,59,0.08)",
                        borderRadius: 14,
                        padding: "18px 20px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{item.label}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            padding: "2px 8px", borderRadius: 20,
                            background: `${color}18`, color,
                          }}>
                            {getScoreLabel(item.score)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            flex: 1, height: 6, borderRadius: 99,
                            background: "rgba(27,38,59,0.08)",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              height: "100%", width: `${item.score}%`,
                              background: color,
                              borderRadius: 99,
                              transition: "width 0.6s ease",
                            }} />
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 700, color, minWidth: 38 }}>
                            {item.score}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── REGULATIONS TAB ─── */}
          {activeTab === "regulations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "flex", gap: 8, alignItems: "center" }}>
                <AlertCircle size={16} /> Latest RBI Regulations & AI Insights
              </div>

              {loadingRegulations ? (
                <div style={{
                  padding: "48px 24px", textAlign: "center",
                  background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)",
                  border: "1px solid rgba(27,38,59,0.08)", borderRadius: 14,
                }}>
                  <div style={{ width: 32, height: 32, border: "3px solid rgba(27,38,59,0.1)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Analyzing recent circulars...</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>ReguAI is reading the RBI master directions and extracting insights.</div>
                </div>
              ) : regulations.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(27,38,59,0.08)", borderRadius: 14 }}>
                  No new regulations found for your organization type.
                </div>
              ) : (
                regulations.map((reg, idx) => {
                  const impactColor = reg.ai_impact_level === "High" ? "#EF4444" : reg.ai_impact_level === "Low" ? "#10B981" : "#F59E0B";
                  const impactBg = reg.ai_impact_level === "High" ? "rgba(239,68,68,0.1)" : reg.ai_impact_level === "Low" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)";

                  return (
                    <div key={idx} style={{
                      background: "rgba(255,255,255,0.7)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(27,38,59,0.08)",
                      borderRadius: 16,
                      padding: "24px 28px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                    }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                              background: impactBg, color: impactColor, textTransform: "uppercase", letterSpacing: "0.5px"
                            }}>
                              {reg.ai_impact_level} Impact
                            </span>
                            {reg.ai_deadline && reg.ai_deadline !== "None" && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", padding: "3px 8px", borderRadius: 6 }}>
                                ⏰ Due: {reg.ai_deadline}
                              </span>
                            )}
                          </div>
                          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px", lineHeight: 1.4 }}>
                            {reg.title}
                          </h3>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16 }}>
                            <span>📅 {reg.date}</span>
                            <span>📄 {reg.reference_number || "Ref: N/A"}</span>
                            {reg.department && <span>🏢 {reg.department.split(".")[0]}</span>}
                          </div>
                        </div>
                      </div>

                      <div style={{ height: 1, background: "rgba(27,38,59,0.08)" }} />

                      {/* AI Summary and Impact Details */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                          {reg.ai_summary}
                        </p>
                        
                        <div style={{
                          background: "var(--background)", border: "1px solid rgba(27,38,59,0.05)", borderRadius: 12, padding: "16px",
                          borderLeft: "4px solid var(--primary)"
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                            Corporate Impact
                          </div>
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                            {reg.ai_impact_on_organization}
                          </p>
                        </div>
                      </div>

                      {/* AI Lists Split View */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 4 }}>
                        
                        {/* Left: Key Changes & Risks */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {reg.ai_key_changes && reg.ai_key_changes.length > 0 && (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                                🔄 Key Changes
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                                {reg.ai_key_changes.map((change, i) => <li key={i}>{change}</li>)}
                              </ul>
                            </div>
                          )}

                          {reg.ai_risk && reg.ai_risk.length > 0 && (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                                ⚠️ Risk if Ignored
                              </div>
                              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                                {reg.ai_risk.map((risk, i) => <li key={i}>{risk}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Right: Actions & Follow Link */}
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          {reg.ai_action_items && reg.ai_action_items.length > 0 && (
                            <div style={{
                              background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "16px"
                            }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                                ✅ Recommended Action Plan
                              </div>
                              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                                {reg.ai_action_items.map((action, i) => (
                                  <li key={i} style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5, display: "flex", gap: 8 }}>
                                    <span style={{ color: "#10B981", flexShrink: 0 }}>•</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div style={{ marginTop: 16, textAlign: "right" }}>
                            <a
                              href={reg.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "10px 20px", borderRadius: 8,
                                border: "1px solid rgba(27,38,59,0.15)",
                                background: "#fff",
                                color: "var(--text-primary)", fontSize: 13, fontWeight: 600,
                                textDecoration: "none", transition: "all 0.2s",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                              }}
                            >
                              Read Official RBI Circular ↗
                            </a>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ─── COMPLIANCE TAB (Compliance AI) ─── */}
          {activeTab === "compliance" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, height: "100%", minHeight: "calc(100vh - 120px)" }}>
              {/* Left Column: Chat Interface */}
              <div style={{
                background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", 
                border: "1px solid rgba(27,38,59,0.08)", borderRadius: 16,
                display: "flex", flexDirection: "column", overflow: "hidden"
              }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(27,38,59,0.08)", background: "rgba(255,255,255,0.4)" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldCheck size={18} color="var(--primary)" /> Compliance AI Agent
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>Ask organizational questions or run risk analysis using RBI GraphRAG.</p>
                </div>

                {/* Chat Messages */}
                <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      background: msg.role === "user" ? "var(--primary)" : "#fff",
                      color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                      padding: "16px 20px", borderRadius: 16, maxWidth: "80%",
                      border: msg.role === "user" ? "none" : "1px solid rgba(27,38,59,0.08)",
                      boxShadow: msg.role === "user" ? "0 4px 12px rgba(27,38,59,0.15)" : "0 2px 8px rgba(0,0,0,0.02)",
                      borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                      borderBottomLeftRadius: msg.role === "user" ? 16 : 4,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, opacity: msg.role === "user" ? 0.8 : 0.5, textTransform: "uppercase" }}>
                        {msg.role === "user" ? "You" : "ReguAI"}
                      </div>
                      <div className="markdown-body" style={{ fontSize: 14, lineHeight: 1.6 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div style={{ alignSelf: "flex-start", padding: "16px 20px", background: "#fff", border: "1px solid rgba(27,38,59,0.08)", borderRadius: 16, borderBottomLeftRadius: 4, display: "flex", gap: 6, alignItems: "center" }}>
                      <div className="dot-flashing" style={{width: 6, height: 6, background: "rgba(27,38,59,0.4)", borderRadius: '50%', animation: 'flash 1s infinite alternate'}}></div>
                      <div className="dot-flashing" style={{width: 6, height: 6, background: "rgba(27,38,59,0.4)", borderRadius: '50%', animation: 'flash 1s infinite alternate', animationDelay: '0.2s'}}></div>
                      <div className="dot-flashing" style={{width: 6, height: 6, background: "rgba(27,38,59,0.4)", borderRadius: '50%', animation: 'flash 1s infinite alternate', animationDelay: '0.4s'}}></div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.8)", borderTop: "1px solid rgba(27,38,59,0.08)" }}>
                  <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Ask about RBI compliance or analyze current documents..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={{
                        flex: 1, padding: "14px 20px", borderRadius: 99, border: "1px solid rgba(27,38,59,0.15)",
                        background: "#fff", fontSize: 14, outline: "none", transition: "all 0.2s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(27,38,59,0.15)"}
                      disabled={isChatLoading}
                    />
                    <button type="submit" disabled={isChatLoading || (!chatInput.trim() && attachedFiles.length === 0)} style={{
                      background: "var(--primary)", color: "#fff", border: "none", borderRadius: 99, padding: "0 24px",
                      fontSize: 14, fontWeight: 600, cursor: isChatLoading ? "not-allowed" : "pointer", opacity: isChatLoading ? 0.7 : 1, transition: "transform 0.1s"
                    }}>
                      Send
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Knowledge Base / Documents */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Upload Area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", 
                    border: "2px dashed rgba(27,38,59,0.15)", borderRadius: 16,
                    padding: "40px 24px", textAlign: "center", cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(27,38,59,0.15)"}
                >
                  <FileText size={40} color="var(--primary)" style={{ opacity: 0.5, marginBottom: 12, margin: '0 auto' }} />
                  <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Upload Organization Data</h4>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", padding: "0 10px" }}>We support PDF, DOCX, and TXT files for compliance risk checks via RBI GraphRAG.</p>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf,.docx,.doc,.txt" multiple onChange={handleFileUpload} />
                </div>

                {/* Attached Sources List */}
                <div style={{
                  background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", 
                  border: "1px solid rgba(27,38,59,0.08)", borderRadius: 16, flex: 1,
                  padding: "20px"
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Attached Sources 
                    <span style={{ background: "rgba(27,38,59,0.06)", padding: "2px 8px", borderRadius: 99, fontSize: 11 }}>{attachedFiles.length}</span>
                  </div>

                  {attachedFiles.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>
                      No documents attached yet.<br/>Upload policies to generate insights.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {attachedFiles.map((f, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 16px", background: "#fff", border: "1px solid rgba(27,38,59,0.06)", borderRadius: 10,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                            <FileText size={16} color="var(--text-secondary)" />
                            <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {f.name}
                            </span>
                          </div>
                          <button onClick={() => removeFile(i)} style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 24, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, padding: "12px", background: "rgba(245,158,11,0.05)", borderRadius: 8, borderLeft: "2px solid #F59E0B" }}>
                    <strong>Note:</strong> Files are securely processed in memory using LangChain to generate compliance insights and are not stored permanently.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── REPORTS TAB ─── */}
          {activeTab === "reports" && (() => {
            const reports = [
              {
                title: "Monthly Compliance Report",
                desc: "Full breakdown of all compliance areas, scores, and regulatory actions for the month.",
                icon: "📊",
                date: "Mar 2026",
                pages: 14,
                status: "Ready",
                statusColor: "#10B981",
              },
              {
                title: "Audit Trail Report",
                desc: "Detailed log of all regulatory interactions, changes, and system events.",
                icon: "🔍",
                date: "Mar 2026",
                pages: 8,
                status: "Ready",
                statusColor: "#10B981",
              },
              {
                title: "Regulation Impact Summary",
                desc: "AI-generated impact assessment of the latest 5 RBI circulars on your org profile.",
                icon: "⚡",
                date: "Feb 2026",
                pages: 5,
                status: "Updated",
                statusColor: "#3B82F6",
              },
              {
                title: "KYC Status Report",
                desc: "Current KYC posture, gaps identified, and CKYC integration readiness score.",
                icon: "🪪",
                date: "Mar 2026",
                pages: 6,
                status: "Action Needed",
                statusColor: "#F59E0B",
              },
              {
                title: "AML Risk Assessment",
                desc: "Anti-money laundering controls evaluation with transaction monitoring coverage.",
                icon: "🛡️",
                date: "Feb 2026",
                pages: 10,
                status: "Ready",
                statusColor: "#10B981",
              },
              {
                title: "Data Localization Readiness",
                desc: "Assessment of data residency compliance and infrastructure gap analysis.",
                icon: "🌐",
                date: "Jan 2026",
                pages: 7,
                status: "Overdue",
                statusColor: "#EF4444",
              },
            ];
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Top summary banner */}
                <div style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(27,38,59,0.08)",
                  borderRadius: 14,
                  padding: "18px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>Reports &amp; Documents</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Auto-generated compliance reports based on your organization profile</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { label: "Ready", count: reports.filter(r => r.status === "Ready").length, color: "#10B981" },
                      { label: "Pending", count: reports.filter(r => r.status !== "Ready").length, color: "#F59E0B" },
                    ].map(({ label, count, color }) => (
                      <div key={label} style={{
                        padding: "6px 14px", borderRadius: 99,
                        background: `${color}12`, border: `1px solid ${color}30`,
                        fontSize: 12, fontWeight: 600, color,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{count}</span> {label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Report cards grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                  {reports.map(report => (
                    <div key={report.title} style={{
                      background: "rgba(255,255,255,0.6)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(27,38,59,0.08)",
                      borderRadius: 14,
                      padding: "20px 22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontSize: 22 }}>{report.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{report.title}</span>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, flexShrink: 0, marginLeft: 8,
                          background: `${report.statusColor}12`,
                          border: `1px solid ${report.statusColor}30`,
                          color: report.statusColor,
                        }}>{report.status}</span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{report.desc}</p>

                      {/* Meta */}
                      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-muted)" }}>
                        <span>📅 {report.date}</span>
                        <span>📄 {report.pages} pages</span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button style={{
                          flex: 1, padding: "8px 0",
                          borderRadius: 8,
                          border: "none",
                          background: "var(--primary)",
                          color: "#fff",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}>
                          ↓ Download PDF
                        </button>
                        <button style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1px solid rgba(27,38,59,0.15)",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          fontSize: 12, cursor: "pointer",
                        }}>
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ─── PROFILE TAB ─── */}
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "flex", gap: 8, alignItems: "center" }}>
                  <User size={16} /> Organization Profile
                </div>
                {!loadingProfile && (
                  <button
                    onClick={() => { if (isEditing) setFormData(profile || {}); setIsEditing(!isEditing); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 16px", borderRadius: 8,
                      border: "1px solid rgba(27,38,59,0.15)",
                      background: isEditing ? "rgba(239,68,68,0.06)" : "rgba(27,38,59,0.05)",
                      color: isEditing ? "#EF4444" : "var(--primary)",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    <Edit2 size={14} />
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                )}
              </div>

              {profileError && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444", fontSize: 13 }}>
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)", color: "#10B981", fontSize: 13 }}>
                  {profileSuccess}
                </div>
              )}

              {loadingProfile ? (
                <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)", fontSize: 13 }}>
                  Loading profile…
                </div>
              ) : profile ? (
                <>
                  {/* Account info */}
                  <div style={{
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(27,38,59,0.08)",
                    borderRadius: 14,
                    padding: "20px 24px",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 16 }}>Account</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[
                        { label: "Username", value: profile.username },
                        { label: "Email", value: profile.email },
                        { label: "Role", value: profile.role },
                        { label: "Member Since", value: profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Organization info */}
                  <div style={{
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(27,38,59,0.08)",
                    borderRadius: 14,
                    padding: "20px 24px",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 16 }}>
                      Organization Details
                    </div>

                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {[
                          { label: "Company Name", key: "company_name", type: "text" },
                          { label: "CIN Number", key: "cin_number", type: "text" },
                          { label: "GSTIN", key: "gstin", type: "text" },
                          { label: "Head Office Location", key: "head_office_location", type: "text" },
                        ].map(({ label, key, type }) => (
                          <div key={key}>
                            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{label}</label>
                            <input
                              type={type}
                              value={formData[key] || ""}
                              onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                              style={{
                                width: "100%", padding: "9px 12px",
                                border: "1px solid rgba(27,38,59,0.18)",
                                borderRadius: 8,
                                background: "rgba(27,38,59,0.03)",
                                color: "var(--text-primary)",
                                fontSize: 13,
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>
                        ))}

                        <div>
                          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Organization Type</label>
                          <select
                            value={formData.organization_type || ""}
                            onChange={e => setFormData({ ...formData, organization_type: e.target.value })}
                            style={{
                              width: "100%", padding: "9px 12px",
                              border: "1px solid rgba(27,38,59,0.18)",
                              borderRadius: 8,
                              background: "rgba(27,38,59,0.03)",
                              color: "var(--text-primary)",
                              fontSize: 13, outline: "none",
                            }}
                          >
                            <option value="NBFC">NBFC</option>
                            <option value="Payment Aggregator">Payment Aggregator</option>
                            <option value="Commercial Bank">Commercial Bank</option>
                          </select>
                        </div>

                        <div style={{ display: "flex", gap: 10, paddingTop: 8, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => { setIsEditing(false); setFormData(profile); }}
                            style={{
                              padding: "9px 20px", borderRadius: 8,
                              border: "1px solid rgba(27,38,59,0.15)",
                              background: "transparent", color: "var(--text-secondary)",
                              fontSize: 13, cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleProfileSave}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "9px 20px", borderRadius: 8,
                              border: "none",
                              background: "var(--primary)", color: "#fff",
                              fontSize: 13, fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            <Save size={14} />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {[
                          { label: "Company Name", value: profile.company_name },
                          { label: "Organization Type", value: profile.organization_type },
                          { label: "CIN Number", value: profile.cin_number },
                          { label: "GSTIN", value: profile.gstin },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{value || "—"}</div>
                          </div>
                        ))}
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>Head Office Location</div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{profile.head_office_location || "—"}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)", fontSize: 13 }}>
                  No profile data available.
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 30 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: "none", // shown via CSS @media
          position: "fixed", top: 14, left: 14, zIndex: 50,
          padding: 8, borderRadius: 8,
          background: "rgba(255,255,255,0.7)", border: "1px solid rgba(27,38,59,0.12)",
          cursor: "pointer",
        }}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );
}
