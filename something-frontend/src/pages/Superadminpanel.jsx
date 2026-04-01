import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";

const API = "http://localhost:5000/api/admin";

const PERMISSIONS = [
  { key: "SUSPEND_USERS",     label: "Suspend Users" },
  { key: "VERIFY_PROFESSORS", label: "Verify Professors" },
  { key: "HANDLE_REPORTS",    label: "Handle Reports" },
  { key: "MODERATE_CONTENT",  label: "Moderate Content" },
  { key: "MANAGE_ROOMS",      label: "Manage Rooms" },
  { key: "VALIDATE_OTHER",    label: "Validate Other Inputs" },
  { key: "APPROVE_RESOURCES", label: "Approve Resources" },
  { key: "DELETE_INACTIVE",   label: "Delete Inactive Accounts" },
];

export default function SuperAdminPanel() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [activeTab, setActiveTab] = useState("stats");

  
  const [stats, setStats] = useState(null);

  const [logs, setLogs] = useState([]);

  const [allUsers, setAllUsers] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [upgradingId, setUpgradingId] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };


  const [applications, setApplications] = useState([]);
  const [rejectingAppId, setRejectingAppId] = useState(null);
const [rejectAppReason, setRejectAppReason] = useState("");


  useEffect(() => {
    if (currentUser?.authorityLevel !== "superadmin") {
      navigate("/dashboard");
    }
  }, []);

  useEffect(() => {
  if (activeTab === "stats") fetchStats();
  if (activeTab === "logs") fetchLogs();
  if (activeTab === "admins") fetchApplications();
}, [activeTab]);


  ///////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/stats`, { headers });
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/logs`, { headers });
      setLogs([...res.data].reverse());
    } catch (err) { console.error(err); }
  };

  const fetchAllUsers = async () => {
    try {
      const params = adminSearch ? `?q=${adminSearch}` : "";
      const res = await axios.get(`${API}/users${params}`, { headers });
      setAllUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleUpgradeAdmin = async (userId) => {
    try {
      await axios.patch(`${API}/users/${userId}/upgrade-admin`, { permissions: selectedPermissions }, { headers });
      alert("User upgraded to admin!");
      setUpgradingId(null);
      setSelectedPermissions([]);
      fetchAllUsers();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!window.confirm("Remove admin status from this user?")) return;
    try {
      await axios.patch(`${API}/users/${userId}/remove-admin`, {}, { headers });
      alert("Admin removed.");
      fetchAllUsers();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };

  const handleUpgradeToSuperAdmin = async (userId) => {
    if (!window.confirm("Upgrade this user to SuperAdmin? This cannot be undone easily.")) return;
    try {
      await axios.patch(`${API}/users/${userId}/upgrade-superadmin`, {}, { headers });
      alert("User upgraded to SuperAdmin!");
      fetchAllUsers();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };

  const handleDeleteAccount = async (userId, username) => {
    if (!window.confirm(`Permanently delete @${username}'s account? This cannot be undone.`)) return;
    const confirm2 = prompt(`Type "@${username}" to confirm deletion:`);
    if (confirm2 !== `@${username}`) return alert("Confirmation failed.");
    try {
      await axios.delete(`${API}/users/${userId}`, { headers });
      alert("Account deleted.");
      fetchAllUsers();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };

  const togglePermission = (key) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const card = { background: "#252b45", borderRadius: "10px", padding: "16px", marginBottom: "12px" };
  const badge = (color) => ({ background: color, color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" });
  const btn = (color = "#6476af") => ({ padding: "6px 14px", borderRadius: "6px", background: color, border: "none", color: "white", cursor: "pointer", fontSize: "12px" });

  const logActionColor = (action) => {
    if (action.includes("delete") || action.includes("reject") || action.includes("suspend")) return "#e74c3c";
    if (action.includes("verify") || action.includes("unsuspend") || action.includes("approve")) return "#27ae60";
    if (action.includes("upgrade") || action.includes("admin")) return "#f39c12";
    return "#6476af";
  };

  const tabs = [
    { id: "stats", label: "📊 Stats" },
    { id: "admins", label: "🛡️ Admin Management" },
    { id: "logs", label: "📋 Platform Logs" },
  ];

  //aplicats
  const fetchApplications = async () => {
  try {
    const res = await axios.get(`${API}/applications`, { headers });
    setApplications(res.data);
  } catch (err) { console.error(err); }
};


const handleRejectApplication = async (userId) => {
  if (!rejectAppReason.trim()) return alert("Please enter a rejection reason.");
  try {
    await axios.post(`${API}/applications/reject`, { userId, reason: rejectAppReason }, { headers });
    alert("Application rejected.");
    setRejectingAppId(null);
    setRejectAppReason("");
    fetchApplications();
  } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
};

  //////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  //to be or not to be...emojies in all pages or no emojis at all.....

  return (
    <div style={{ minHeight: "100vh", background: "#1a1f35", color: "white", padding: "20px" }}>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "24px" }}>
        <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>←</button>
        <div>
          <h2 style={{ margin: 0 }}>⚡ SuperAdmin Panel</h2>
          <small style={{ opacity: 0.5 }}>@{currentUser?.username} — superadmin</small>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px",
            background: activeTab === tab.id ? "#6476af" : "rgba(255,255,255,0.08)",
            color: "white", fontWeight: activeTab === tab.id ? "600" : "400"
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {activeTab === "stats" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>Platform Overview</h3>
          {!stats ? <p style={{ opacity: 0.5 }}>Loading...</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { label: "Total Users", value: stats.totalUsers, icon: "👥" },
                { label: "Total Posts", value: stats.totalPosts, icon: "📝" },
                { label: "Total Comments", value: stats.totalComments, icon: "🗨️" },
                { label: "Total Rooms", value: stats.totalRooms, icon: "🏠" },
                { label: "Suspended Users", value: stats.suspendedUsers, icon: "🚫" },
                { label: "Pending Professors", value: stats.pendingProfessors, icon: "🎓" },
                { label: "Reported Content", value: stats.reportedContent, icon: "🚩" },
              ].map(s => (
                <div key={s.label} style={{ ...card, textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "6px" }}>{s.icon}</div>
                  <strong style={{ fontSize: "24px", display: "block" }}>{s.value}</strong>
                  <small style={{ opacity: 0.5 }}>{s.label}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

{/* admin tab for only aplicats */}
     {activeTab === "admins" && (
  <div>
    <h3 style={{ marginBottom: "16px" }}>Admin Applications</h3>

    {applications.length === 0 ? (
      <p style={{ opacity: 0.5 }}>No pending applications.</p>
    ) : (
      applications.map(app => {
        const isRejecting = rejectingAppId === app.userId;
        const isUpgrading = upgradingId === app.userId;

        return (
          <div key={app.userId} style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: isUpgrading || isRejecting ? "12px" : "0" }}>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <strong>@{app.username}</strong>
                  <span style={badge("#6476af")}>applicant</span>
                  <span style={badge("#f39c12")}>⭐ {app.rating}/5</span>
                </div>
                <small style={{ opacity: 0.5 }}>
                  {app.email} • Applied {new Date(app.appliedAt).toLocaleString()}
                </small>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => { setUpgradingId(app.userId); setSelectedPermissions([]); }} style={btn("#f39c12")}>
                  🛡️ Accept
                </button>
                <button onClick={() => { setRejectingAppId(app.userId); setRejectAppReason(""); }} style={btn("#c0392b")}>
                  ✕ Reject
                </button>
              </div>
            </div>

            {/* permission picker on accept */}
            {isUpgrading && (
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "13px", opacity: 0.7 }}>Select permissions:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {PERMISSIONS.map(p => (
                    <label key={p.key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(p.key)}
                        onChange={() => togglePermission(p.key)}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleUpgradeAdmin(app.userId)} style={btn("#27ae60")}>
                    Confirm
                  </button>
                  <button onClick={() => { setUpgradingId(null); setSelectedPermissions([]); }} style={btn("rgba(255,255,255,0.1)")}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* reason input on reject */}
            {isRejecting && (
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "12px" }}>
                <input
                  type="text"
                  placeholder="Reason for rejection..."
                  value={rejectAppReason}
                  onChange={(e) => setRejectAppReason(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", boxSizing: "border-box", marginBottom: "8px" }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleRejectApplication(app.userId)} style={btn("#c0392b")}>
                    Confirm Reject
                  </button>
                  <button onClick={() => { setRejectingAppId(null); setRejectAppReason(""); }} style={btn("rgba(255,255,255,0.1)")}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        );
      })
    )}
  </div>
)}

      {/* ── LOGS TAB ── */}
      {activeTab === "logs" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>Platform Action Logs</h3>
          {logs.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No logs yet.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ ...card, display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: logActionColor(log.action), flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "13px" }}>@{log.adminUsername}</strong>
                    <span style={{ ...badge(logActionColor(log.action)), fontSize: "10px" }}>{log.action}</span>
                  </div>
                  <small style={{ opacity: 0.6 }}>{log.details}</small>
                </div>
                <small style={{ opacity: 0.4, fontSize: "11px", flexShrink: 0 }}>
                  {new Date(log.createdAt).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}