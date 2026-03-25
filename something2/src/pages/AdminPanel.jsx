import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
 
const API = "http://localhost:5000/api/admin";
 
export default function AdminPanel() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [activeTab, setActiveTab] = useState("stats");
 

  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
 

  const [pendingProfessors, setPendingProfessors] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
 
 
  const [reports, setReports] = useState([]);
 
 
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
 
  const isSuperAdmin = currentUser?.authorityLevel === "superadmin";
 
  const headers = { Authorization: `Bearer ${token}` };
 //////////////////////////////////////////////////////////////////////////////////
 ///////////////////////////////////////////////////////////////////////////////////////////////////
 //////////////////////////////////////////////////////////////////////////////////
  
  useEffect(() => {
    const level = currentUser?.authorityLevel;
    if (level !== "admin" && level !== "superadmin") {
      navigate("/dashboard");
    }
  }, []);
 
  
  useEffect(() => {
    if (activeTab === "stats") fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "professors") fetchPendingProfessors();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "announcements") fetchAnnouncements();
  }, [activeTab]);


  ////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
 
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/stats`, { headers });
      setStats(res.data);
    } catch (err) { console.error(err); }
  };
 
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch) params.append("q", userSearch);
      if (userRoleFilter) params.append("role", userRoleFilter);
      if (userStatusFilter) params.append("status", userStatusFilter);
      const res = await axios.get(`${API}/users?${params}`, { headers });
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };
 
  const fetchPendingProfessors = async () => {
    try {
      const res = await axios.get(`${API}/professors/pending`, { headers });
      setPendingProfessors(res.data);
    } catch (err) { console.error(err); }
  };
 
  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/reports`, { headers });
      setReports(res.data);
    } catch (err) { console.error(err); }
  };
 
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API}/announcements`);
      setAnnouncements(res.data);
    } catch (err) { console.error(err); }
  };
 
 
  const handleSuspend = async (userId) => {
    const days = prompt("Suspend for how many days?");
    if (!days) return;
    const reason = prompt("Reason for suspension?");
    if (!reason) return;
    try {
      await axios.patch(`${API}/users/${userId}/suspend`, { days: Number(days), reason }, { headers });
      alert("User suspended.");
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };
 
  const handleUnsuspend = async (userId) => {
    try {
      await axios.patch(`${API}/users/${userId}/unsuspend`, {}, { headers });
      alert("User unsuspended.");
      fetchUsers();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };
 
  const handleVerifyProfessor = async (userId) => {
    try {
      await axios.patch(`${API}/professors/${userId}/verify`, {}, { headers });
      alert("Professor verified!");
      fetchPendingProfessors();
      fetchStats();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };
 
  const handleRejectProfessor = async (userId) => {
    if (!rejectReason.trim()) return alert("Please enter a rejection reason.");
    try {
      await axios.patch(`${API}/professors/${userId}/reject`, { reason: rejectReason }, { headers });
      alert("Professor rejected and demoted to student.");
      setRejectingId(null);
      setRejectReason("");
      fetchPendingProfessors();
      fetchStats();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };
 
  const handleHideContent = async (type, postId, commentId) => {
    if (!window.confirm(`Hide this ${type}?`)) return;
    try {
      await axios.patch(`${API}/content/hide`, { type, postId, commentId }, { headers });
      alert("Content hidden.");
      fetchReports();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };
 
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    try {
      await axios.post(`${API}/announcements`, { message: newAnnouncement }, { headers });
      setNewAnnouncement("");
      fetchAnnouncements();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };
 
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await axios.delete(`${API}/announcements/${id}`, { headers });
      fetchAnnouncements();
    } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
  };
 
 
  const card = { background: "#252b45", borderRadius: "10px", padding: "16px", marginBottom: "12px" };
  const badge = (color) => ({ background: color, color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" });
  const btn = (color = "#6476af") => ({ padding: "6px 14px", borderRadius: "6px", background: color, border: "none", color: "white", cursor: "pointer", fontSize: "12px" });
 
  const tabs = [
    { id: "stats", label: "📊 Stats" },
    { id: "users", label: "👥 Users" },
    { id: "professors", label: "🎓 Professors" },
    { id: "reports", label: "🚩 Reports" },
    { id: "announcements", label: "📢 Announcements" },
  ];
 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
  return (
    <div style={{ minHeight: "100vh", background: "#1a1f35", color: "white", padding: "20px" }}>
 
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "24px" }}>
        <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>←</button>
        <div>
          <h2 style={{ margin: 0 }}>Admin Panel</h2>
          <small style={{ opacity: 0.5 }}>@{currentUser?.username} — {currentUser?.authorityLevel}</small>
        </div>
        {isSuperAdmin && (
          <button onClick={() => navigate("/superadmin")} style={{ ...btn("#4a3f6b"), marginLeft: "auto" }}>
            ⚡ SuperAdmin Panel
          </button>
        )}
      </div>
 
      {/* tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px", flexWrap: "wrap" }}>
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
 
      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>User Management</h3>
 
          {/* filters */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <input
              type="text" placeholder="Search by username..."
              value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", flex: 1 }}
            />
            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "#252b45", color: "white" }}>
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="professor">Professor</option>
            </select>
            <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "#252b45", color: "white" }}>
              <option value="">All Status</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending Verification</option>
            </select>
            <button onClick={fetchUsers} style={btn()}>Search</button>
          </div>
 
          {users.length === 0 ? <p style={{ opacity: 0.5 }}>No users found.</p> : (
            users.map(user => {
              const isSuspended = user.suspendedUntil && new Date(user.suspendedUntil) > new Date();
              return (
                <div key={user.id} style={{ ...card, display: "flex", alignItems: "center", gap: "12px" }}>
                  <img src={user.profilePic || Cat} alt="pfp" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <strong>@{user.username}</strong>
                      <span style={badge("#6476af")}>{user.role}</span>
                      {user.authorityLevel !== "user" && <span style={badge("#4a3f6b")}>{user.authorityLevel}</span>}
                      {isSuspended && <span style={badge("#c0392b")}>suspended</span>}
                      {user.verificationStatus === "pending" && <span style={badge("#e67e22")}>pending prof</span>}
                    </div>
                    <small style={{ opacity: 0.5 }}>
                      {user.email} • rating: {user.rating ?? 1}/5 • violations: {user.violationCount || 0}
                    </small>
                    {isSuspended && (
                      <small style={{ display: "block", color: "#e74c3c", marginTop: "2px" }}>
                        Suspended until {new Date(user.suspendedUntil).toLocaleDateString()} — {user.suspensionReason}
                      </small>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {!isSuspended && user.authorityLevel === "user" && (
                      <button onClick={() => handleSuspend(user.id)} style={btn("#c0392b")}>🚫 Suspend</button>
                    )}
                    {isSuspended && (
                      <button onClick={() => handleUnsuspend(user.id)} style={btn("#27ae60")}>✅ Unsuspend</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
 
      {/* ── PROFESSORS TAB ── */}
      {activeTab === "professors" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>Pending Professor Verification</h3>
          {pendingProfessors.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No pending professor requests.</p>
          ) : (
            pendingProfessors.map(prof => (
              <div key={prof.id} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <img src={prof.profilePic || Cat} alt="pfp" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <strong>@{prof.username}</strong>
                    <small style={{ display: "block", opacity: 0.5 }}>{prof.email}</small>
                    <small style={{ display: "block", opacity: 0.5 }}>Majors: {prof.majors?.join(", ")}</small>
                  </div>
                </div>
 
                {prof.proofFile && (
                  <a href={prof.proofFile} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", marginBottom: "10px", padding: "6px 12px", background: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", textDecoration: "none", fontSize: "13px" }}>
                    📄 View Proof Document
                  </a>
                )}
 
                {rejectingId === prof.id ? (
                  <div style={{ marginTop: "10px" }}>
                    <input
                      type="text" placeholder="Reason for rejection..."
                      value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", boxSizing: "border-box", marginBottom: "8px" }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleRejectProfessor(prof.id)} style={btn("#c0392b")}>Confirm Reject</button>
                      <button onClick={() => { setRejectingId(null); setRejectReason(""); }} style={btn("rgba(255,255,255,0.1)")}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleVerifyProfessor(prof.id)} style={btn("#27ae60")}>✅ Verify</button>
                    <button onClick={() => setRejectingId(prof.id)} style={btn("#c0392b")}>❌ Reject</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
 
      {/* ── REPORTS TAB ── */}
      {activeTab === "reports" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>Reported Content</h3>
          {reports.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No reported content.</p>
          ) : (
            reports.map(item => (
              <div key={item.id} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={badge(item.type === "post" ? "#6476af" : "#4a3f6b")}>{item.type}</span>
                  <strong>@{item.authorUsername}</strong>
                  <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: "12px" }}>
                    {item.reports?.length} report(s)
                  </span>
                </div>
                <p style={{ margin: "0 0 8px", opacity: 0.8, fontSize: "14px" }}>{item.content?.slice(0, 150)}</p>
                <div style={{ marginBottom: "10px" }}>
                  {item.reports?.map((r, i) => (
                    <small key={i} style={{ display: "block", opacity: 0.5, fontSize: "11px" }}>
                      — {r.reason} ({new Date(r.createdAt).toLocaleDateString()})
                    </small>
                  ))}
                </div>
                {!item.isHidden && (
                  <button
                    onClick={() => handleHideContent(item.type, item.type === "post" ? item.id : item.postId, item.type === "comment" ? item.id : null)}
                    style={btn("#c0392b")}
                  >
                    🙈 Hide Content
                  </button>
                )}
                {item.isHidden && <span style={{ color: "#e74c3c", fontSize: "12px" }}>⚠️ Already hidden</span>}
              </div>
            ))
          )}
        </div>
      )}
 
      {/* ── ANNOUNCEMENTS TAB ── */}
      {activeTab === "announcements" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>Platform Announcements</h3>
 
          {isSuperAdmin && (
            <div style={{ ...card, marginBottom: "20px" }}>
              <textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Write a platform-wide announcement..."
                style={{ width: "100%", minHeight: "80px", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", boxSizing: "border-box", resize: "vertical", marginBottom: "10px" }}
              />
              <button onClick={handleCreateAnnouncement} disabled={!newAnnouncement.trim()} style={btn()}>
                📢 Post Announcement
              </button>
            </div>
          )}
 
          {announcements.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No announcements yet.</p>
          ) : (
            announcements.map(a => (
              <div key={a.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: "0 0 6px" }}>{a.message}</p>
                    <small style={{ opacity: 0.5 }}>By @{a.createdBy} — {new Date(a.createdAt).toLocaleString()}</small>
                  </div>
                  {isSuperAdmin && (
                    <button onClick={() => handleDeleteAnnouncement(a.id)} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "16px" }}>🗑️</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
 
    </div>
  );
}