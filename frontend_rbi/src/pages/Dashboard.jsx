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

  // Reports state
  const [reportsList, setReportsList] = useState([]);
  const [activeReportId, setActiveReportId] = useState(null);
  const [reportProgress, setReportProgress] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data for demo impact
  const mockRegulatoryAlerts = [
    { title: "Master Direction: CKYC 2024", severity: "CRITICAL", date: "2 hours ago", icon: "🔴" },
    { title: "Circular: Lending Transparency", severity: "HIGH", date: "1 day ago", icon: "🟡" },
    { title: "Notification: PMLA Internal Audit", severity: "INFO", date: "3 days ago", icon: "🔵" },
  ];

  const mockRiskMetrics = [
    { label: "Data Localization", value: 94, status: "Secure" },
    { label: "KYC Drift", value: 12, status: "Low Risk" },
    { label: "AML Monitoring", value: 88, status: "Operational" },
  ];

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
      // Mock data for hackathon demo impact
      const mockRegs = [
        {
          title: "Master Direction – Know Your Customer (KYC) Direction, 2016 (Updated 2024)",
          date: "Jan 04, 2024",
          reference_number: "RBI/DBR/2015-16/18",
          department: "Department of Regulation",
          ai_impact_level: "High",
          ai_deadline: "March 31, 2024",
          ai_summary: "Amendment to include Video-based Customer Identification Process (V-CIP) for all NBFCs with simplified due diligence for small accounts.",
          ai_impact_on_organization: "Requires immediate update of the onboard logic to support Aadhaar-offline XML and V-CIP encryption standards.",
          ai_key_changes: ["Include V-CIP in KYC policy", "Simplified due diligence for low-value accounts"],
          ai_risk: ["Non-compliance with encryption standards", "Incomplete audit trails for V-CIP sessions"],
          ai_action_items: ["Implement AES-256 for V-CIP storage", "Update privacy policy to reflect XML-Aadhaar usage", "Conduct internal audit of onboarding logs"]
        },
        {
          title: "Framework for Scale Based Regulation for Non-Banking Financial Companies",
          date: "Oct 22, 2023",
          reference_number: "RBI/2023-24/102",
          department: "Department of Supervision",
          ai_impact_level: "Medium",
          ai_deadline: "None",
          ai_summary: "Categorization of NBFCs into Base, Middle, Upper and Top Layers based on asset size and risk profile.",
          ai_impact_on_organization: "As a 'Middle Layer' NBFC, stricter capital adequacy and disclosure norms apply starting next fiscal.",
          ai_key_changes: ["New classification criteria", "Mandatory compliance officer for Middle Layer"],
          ai_risk: ["Capital adequacy ratio falling below 15%", "Delayed disclosure of promoter shareholding"],
          ai_action_items: ["Recalculate CRAR based on new risk weights", "Automate quarterly disclosure filings", "Verify promoter shareholding status"]
        }
      ];
      setRegulations(mockRegs);
      setLoadingRegulations(false);
    }
  }, [activeTab]);

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

  // --- Audit Report Logic ---
  const fetchReportsList = async () => {
    try {
      const token = localStorage.getItem("access");
      const response = await api.get("compliance/reports/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportsList(response.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReportsList();
    }
  }, [activeTab]);

  useEffect(() => {
    let pollInterval;
    if (activeReportId) {
      pollInterval = setInterval(async () => {
        try {
          const response = await api.get(`compliance/report/status/${activeReportId}`);
          setReportProgress(response.data);
          if (response.data.status === "COMPLETED" || response.data.status === "FAILED") {
            setActiveReportId(null);
            setIsGenerating(false);
            fetchReportsList();
          }
        } catch (err) {
          console.error("Polling error:", err);
          setActiveReportId(null);
          setIsGenerating(false);
        }
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [activeReportId]);

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
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ 
                  fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", 
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "4px 0"
                }}>
                  <Activity size={16} />
                  Compliance Scores
                </div>

                {/* Metrics Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {mockRiskMetrics.map(metric => (
                    <div key={metric.label} style={{
                      padding: "20px", borderRadius: 16, background: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(27,38,59,0.08)", backdropFilter: "blur(10px)",
                      minWidth: 0
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{metric.label}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>{metric.value}%</div>
                        <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>{metric.status}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Alerts and Analytics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Recent Alerts */}
                  <div style={{
                    padding: "24px", borderRadius: 20, background: "#fff", border: "1px solid rgba(27,38,59,0.08)",
                    minWidth: 0
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertCircle size={18} color="#EF4444" /> Live Regulatory Alerts
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {mockRegulatoryAlerts.map(alert => (
                        <div key={alert.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", overflow: "hidden" }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{alert.icon}</span>
                            <div style={{ overflow: "hidden" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{alert.title}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{alert.date}</div>
                            </div>
                          </div>
                          <span style={{ 
                            fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 4, flexShrink: 0,
                            background: alert.severity === "CRITICAL" ? "#EF444410" : "#F59E0B10",
                            color: alert.severity === "CRITICAL" ? "#EF4444" : "#F59E0B"
                          }}>{alert.severity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compliance Posture Chart Mock */}
                  <div style={{
                    padding: "24px", borderRadius: 20, background: "var(--primary)", color: "#fff", 
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    minWidth: 0
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>Compliance Posture</div>
                      <div style={{ fontSize: 32, fontWeight: 800 }}>88.4<span style={{ fontSize: 18, opacity: 0.6 }}>/100</span></div>
                    </div>
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8, opacity: 0.8 }}>
                        <span>System Health</span>
                        <span>Operational</span>
                      </div>
                      <div style={{ height: 6, width: "100%", background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "88%", background: "#10B981" }} />
                      </div>
                      <p style={{ fontSize: 11, marginTop: 12, opacity: 0.7, lineHeight: 1.5 }}>
                        ReguAI Agentic Engine is monitoring 12 concurrent RBI endpoints. No critical breaches detected in current epoch.
                      </p>
                    </div>
                  </div>
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
          {activeTab === "reports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Header Box */}
              <div style={{
                padding: "24px 28px", borderRadius: 16, background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(12px)", border: "1px solid rgba(27,38,59,0.08)",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Professional Audit Documents</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>Formal compliance assessments generated via RBI ReguAI FSM Engine.</p>
                </div>
                <button
                  disabled={isGenerating}
                  onClick={async () => {
                    setIsGenerating(true);
                    try {
                      const response = await api.post("compliance/report/generate/");
                      setActiveReportId(response.data.report_id);
                    } catch (err) {
                      console.error("Generation error:", err);
                      setIsGenerating(false);
                    }
                  }}
                  style={{
                    background: "var(--primary)", color: "#fff", border: "none",
                    padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: isGenerating ? "not-allowed" : "pointer", opacity: isGenerating ? 0.7 : 1
                  }}
                >
                  {isGenerating ? "Processing..." : "Generate New Audit"}
                </button>
              </div>

              {/* Progress Bar (Visible during generation) */}
              {(isGenerating || activeReportId) && (
                <div style={{
                  padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.8)",
                  border: "1px solid var(--primary)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                      {reportProgress?.current_state?.replace(/_/g, " ") || "INITIALIZING FSM ARCHITECTURE"}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{reportProgress?.progress || 0}%</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(27,38,59,0.1)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ 
                      height: "100%", background: "var(--primary)", width: `${reportProgress?.progress || 0}%`,
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    {["INIT", "MODEL", "AUDIT", "PLAN", "FINAL"].map((step, idx) => (
                      <div key={idx} style={{ 
                        flex: 1, height: 4, borderRadius: 2,
                        background: (reportProgress?.progress || 0) >= (idx + 1) * 20 ? "var(--primary)" : "rgba(27,38,59,0.1)"
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Reports Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {reportsList.length === 0 && !isGenerating ? (
                  <div style={{ gridColumn: "1 / -1", padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                    No audit reports generated yet. Click above to start a formal professional audit.
                  </div>
                ) : (
                  reportsList.map(report => (
                    <div key={report.report_id} style={{
                      background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid rgba(27,38,59,0.08)",
                      display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ width: 44, height: 44, background: "rgba(27,38,59,0.05)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={22} color="var(--primary)" />
                        </div>
                        <span style={{ 
                          fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 6,
                          background: report.status === "COMPLETED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                          color: report.status === "COMPLETED" ? "#10B981" : "#F59E0B"
                        }}>
                          {report.status}
                        </span>
                      </div>
                      
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Regulatory Audit Report</h4>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Report ID: {report.report_id.slice(0, 8)}...</p>
                      </div>

                      <div style={{ display: "flex", gap: 16, marginTop: "auto" }}>
                        <button 
                          onClick={() => {
                            const token = localStorage.getItem("access");
                            window.open(`http://localhost:8000/api/compliance/report/download/${report.report_id}?token=${token}`, "_blank");
                          }}
                          style={{
                            flex: 1, padding: "10px", borderRadius: 8, background: "var(--primary)", color: "#fff",
                            border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          Download PDF
                        </button>
                        <button style={{
                          padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(27,38,59,0.15)",
                          background: "transparent", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer"
                        }}>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

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
