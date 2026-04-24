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


  const [drillDown, setDrillDown] = useState(null);
// shape: { type: "users"|"posts"|"comments"|"rooms"|"suspended"|"userHistory", data: [...], title: "" }
 
  const isSuperAdmin = currentUser?.authorityLevel === "superadmin";
 
  const headers = { Authorization: `Bearer ${token}` };


  const [pendingResources, setPendingResources] = useState([]);
const [hiddenContent, setHiddenContent] = useState([]);
const [otherInputs, setOtherInputs] = useState([]);

const [roomRequests, setRoomRequests] = useState([]);
const [rejectingRoomId, setRejectingRoomId] = useState(null);
const [rejectRoomReason, setRejectRoomReason] = useState("");

const [roomRequestLoading, setRoomRequestLoading] = useState(null); // stores the requestId being processed


const [moderationRooms, setModerationRooms] = useState([]);
const [selectedRoom, setSelectedRoom] = useState(null);
const [roomSuspendingId, setRoomSuspendingId] = useState(null);
const [roomSuspendDays, setRoomSuspendDays] = useState("");
const [roomSuspendReason, setRoomSuspendReason] = useState("");

//i want search in room tab...
const [roomSearch, setRoomSearch] = useState("");
const [roomTypeFilter, setRoomTypeFilter] = useState("");
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
  if (activeTab === "resources") fetchPendingResources();
  if (activeTab === "hidden") fetchHiddenContent();
  if (activeTab === "other") fetchOtherInputs();
  if (activeTab === "announcements") fetchAnnouncements();
  if (activeTab === "room-requests") fetchRoomRequests();
  if (activeTab === "rooms") fetchModerationRooms();
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
      console.log("user sample:", res.data[0]);
    } catch (err) { console.error(err); }
  };
 
  const fetchPendingProfessors = async () => {
    try {
      const res = await axios.get(`${API}/professors/pending`, { headers });
      setPendingProfessors(res.data);
      console.log("prof sample:", res.data[0]);
    } catch (err) { console.error(err); }
  };
 

  //just noting that this might be a problem causer....
 const fetchReports = async () => {
  try {
    const res = await axios.get(`${API}/reports`, { headers });
    const flat = [
      ...res.data.posts.map(p => ({ ...p, type: "post" })),
      ...res.data.comments.map(c => ({ ...c, type: "comment" }))
    ];
    setReports(flat);
  } catch (err) { console.error(err); }
};
 
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API}/announcements`);
      setAnnouncements(res.data);
      console.log("announcements raw:", res.data[0]);
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


  const handleApproveResource = async (postId, approved) => {
  try {
    await axios.patch(`${API}/content/resource`, { postId, approved }, { headers });
    fetchPendingResources();
    fetchStats();
  } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
};

const handleRestoreContent = async (type, postId, commentId = null) => {
  if (!window.confirm(`Restore this ${type}?`)) return;
  try {
    await axios.patch(`${API}/content/restore`, { type, postId, commentId }, { headers });
    fetchHiddenContent();
  } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
};

const handleValidateOtherInput = async (userId, approved) => {
  try {
    await axios.patch(`${API}/other-inputs/validate`, { userId, approved }, { headers });
    fetchOtherInputs();
  } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
};
 
 
  const card = { background: "#252b45", borderRadius: "10px", padding: "16px", marginBottom: "12px" };
  const badge = (color) => ({ background: color, color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" });
  const btn = (color = "#6476af") => ({ padding: "6px 14px", borderRadius: "6px", background: color, border: "none", color: "white", cursor: "pointer", fontSize: "12px" });
 
//   const tabs = [
//   { id: "stats", label: "📊 Stats" },
//   { id: "users", label: "👥 Users" },
//   { id: "professors", label: "🎓 Professors" },
//   { id: "reports", label: "🚩 Reports" },
//   { id: "resources", label: "📦 Resources" },
//   { id: "hidden", label: "🙈 Hidden" },
//   { id: "other", label: "🔤 Other Inputs" },
//   { id: "announcements", label: "📢 Announcements" },
// ];
//this mess so only realated tabs show based on permissions
const tabs = [
  // { id: "stats", label: "📊 Stats" },
  { id: "announcements", label: "📢 Announcements" },
  ...(isSuperAdmin || currentUser?.permissions?.includes("SUSPEND_USERS")
    ? [{ id: "users", label: "👥 Users" }] : []),
  ...(isSuperAdmin || currentUser?.permissions?.includes("VERIFY_PROFESSORS")
    ? [{ id: "professors", label: "🎓 Professors" }] : []),
  ...(isSuperAdmin || currentUser?.permissions?.includes("HANDLE_REPORTS")
    ? [{ id: "reports", label: "🚩 Reports" }] : []),
  ...(isSuperAdmin || currentUser?.permissions?.includes("APPROVE_RESOURCES")
    ? [{ id: "resources", label: "📦 Resources" }] : []),
  ...(isSuperAdmin || currentUser?.permissions?.includes("MODERATE_CONTENT")
    ? [{ id: "hidden", label: "🙈 Hidden" }] : []),
  ...(isSuperAdmin || currentUser?.permissions?.includes("VALIDATE_OTHER")
    ? [{ id: "other", label: "🔤 Other Inputs" }] : []),
  ...(isSuperAdmin || currentUser?.permissions?.includes("MANAGE_ROOMS")
  ? [
      { id: "room-requests", label: "📬 Room Requests" },
      { id: "rooms", label: "🏠 Room Moderation" }
    ] 
  : []),
];


  const fetchDrillDown = async (type) => {
  try {
    switch(type) {
      case "users": {
        const res = await axios.get(`${API}/users`, { headers });
        setDrillDown({ type: "users", title: "All Users", data: res.data });
        break;
      }
      case "suspended": {
        const res = await axios.get(`${API}/users?status=suspended`, { headers });
        setDrillDown({ type: "users", title: "Suspended Users", data: res.data });
        break;
      }
      case "posts": {
        const res = await axios.get(`${API}/posts`, { headers });
        setDrillDown({ type: "posts", title: "All Posts", data: res.data });
        break;
      }
      case "comments": {
        const res = await axios.get(`${API}/posts`, { headers });
        const comments = [];
        res.data.forEach(post => {
          post.comments?.forEach(c => comments.push({ ...c, postTitle: post.title || "Untitled" }));
        });
        setDrillDown({ type: "comments", title: "All Comments", data: comments });
        break;
      }
      case "rooms": {
      const res = await axios.get(`${API}/rooms`, { headers });
       setDrillDown({ type: "rooms", title: "All Rooms", data: res.data });
       break;
      }
      default: break;
    }
  } catch (err) { console.error(err); }
};
 

const fetchPendingResources = async () => {
  try {
    const res = await axios.get(`${API}/resources/pending`, { headers });
    setPendingResources(res.data);
    console.log("resource sample:", res.data[0]);
  } catch (err) { console.error(err); }
};

const fetchHiddenContent = async () => {
  try {
    const res = await axios.get(`${API}/content/hidden`, { headers });
    const flat = [
      ...res.data.posts.map(p => ({ ...p, type: "post" })),
      ...res.data.comments.map(c => ({ ...c, type: "comment" }))
    ];
    setHiddenContent(flat);
  } catch (err) { console.error(err); }
};

const fetchOtherInputs = async () => {
  try {
    const res = await axios.get(`${API}/other-inputs`, { headers });
     console.log("other inputs raw:", res.data);
    setOtherInputs(res.data);
  } catch (err) { console.error(err); }
};


const fetchRoomRequests = async () => {
  try {
    const res = await axios.get(`${API}/room-requests`, { headers });
    setRoomRequests(res.data);
  } catch (err) { console.error(err); }
};

const handleRoomRequest = async (requestId, approved) => {
  if (!approved && !rejectRoomReason.trim()) return alert("Please enter a rejection reason.");
  setRoomRequestLoading(requestId);
  try {
    await axios.post(`${API}/room-requests/handle`, 
      { requestId, approved, reason: rejectRoomReason }, 
      { headers }
    );
    setRejectingRoomId(null);
    setRejectRoomReason("");
    fetchRoomRequests();
  } catch (err) { 
    alert(err.response?.data?.message || "Something went wrong."); 
  } finally {
    setRoomRequestLoading(null);
  }
};

const fetchModerationRooms = async () => {
  try {
    const [roomsRes, usersRes] = await Promise.all([
      axios.get(`${API}/rooms-moderation`, { headers }),
      axios.get(`${API}/users`, { headers })
    ]);
    setModerationRooms(roomsRes.data);
    setUsers(usersRes.data);
  } catch (err) { console.error(err); }
};

const handleRoomSuspend = async (roomId, userId) => {
  if (!roomSuspendDays || !roomSuspendReason.trim()) return alert("Please fill in days and reason.");
  try {
    await axios.patch(`${API}/rooms-moderation/suspend`, 
      { roomId, userId, days: Number(roomSuspendDays), reason: roomSuspendReason },
      { headers }
    );
    setRoomSuspendingId(null);
    setRoomSuspendDays("");
    setRoomSuspendReason("");
    // refresh selected room members
    const res = await axios.get(`${API}/rooms-moderation`, { headers });
    setModerationRooms(res.data);
    setSelectedRoom(res.data.find(r => r.id === roomId));
  } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
};

const handleRoomUnsuspend = async (roomId, userId) => {
  try {
    await axios.patch(`${API}/rooms-moderation/unsuspend`, { roomId, userId }, { headers });
    const res = await axios.get(`${API}/rooms-moderation`, { headers });
    setModerationRooms(res.data);
    setSelectedRoom(res.data.find(r => r.id === roomId));
  } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
};

const handleDeleteRoom = async (roomId) => {
  if (!window.confirm("Permanently delete this room?")) return;
  try {
    await axios.delete(`${API}/rooms-moderation/${roomId}`, { headers });
    setSelectedRoom(null);
    fetchModerationRooms();
  } catch (err) { alert(err.response?.data?.message || "Something went wrong."); }
};


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
 
      {/* ── STATS TAB ──....maybe admins should not have this and only supperadmin should? */}
      {/* {activeTab === "stats" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>Platform Overview</h3>
          {!stats ? <p style={{ opacity: 0.5 }}>Loading...</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
  { label: "Total Users", value: stats.totalUsers, icon: "👥", action: () => fetchDrillDown("users") },
  { label: "Total Posts", value: stats.totalPosts, icon: "📝", action: () => fetchDrillDown("posts") },
  { label: "Total Comments", value: stats.totalComments, icon: "🗨️", action: () => fetchDrillDown("comments") },
  { label: "Total Rooms", value: stats.totalRooms, icon: "🏠", action: () => fetchDrillDown("rooms") },
  { label: "Suspended Users", value: stats.suspendedUsers, icon: "🚫", action: () => fetchDrillDown("suspended") },
  { label: "Pending Professors", value: stats.pendingProfessors, icon: "🎓", action: () => setActiveTab("professors") },
  { label: "Reported Content", value: stats.reportedContent, icon: "🚩", action: () => setActiveTab("reports") },
].map(s => (
  <div key={s.label} onClick={s.action} style={{ ...card, textAlign: "center", cursor: "pointer",
    transition: "background 0.2s" }}
    onMouseEnter={e => e.currentTarget.style.background = "#2f3655"}
    onMouseLeave={e => e.currentTarget.style.background = "#252b45"}
  >
    <div style={{ fontSize: "28px", marginBottom: "6px" }}>{s.icon}</div>
    <strong style={{ fontSize: "24px", display: "block" }}>{s.value}</strong>
    <small style={{ opacity: 0.5 }}>{s.label}</small>
  </div>
))}
            </div>
          )}
        </div>
        
      )} */}
 
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
              const isSuspended = user.suspended_until && new Date(user.suspended_until) > new Date();
              return (
                <div key={user.id} style={{ ...card, display: "flex", alignItems: "center", gap: "12px" }}>
                  <img src={user.profile_pic_url || Cat} alt="pfp" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <strong>@{user.username}</strong>
                      <span style={badge("#6476af")}>{user.role}</span>
{user.authority_level !== "user" && <span style={badge("#4a3f6b")}>{user.authority_level}</span>}
                      {isSuspended && <span style={badge("#c0392b")}>suspended</span>}
{user.verification_status === "pending" && <span style={badge("#e67e22")}>pending prof</span>}
                    </div>
                    <small style={{ opacity: 0.5 }}>
                      {user.email} • rating: {user.rating ?? 1}/5 • violations: {user.violation_count || 0}

                    </small>
                    {isSuspended && (
                      <small style={{ display: "block", color: "#e74c3c", marginTop: "2px" }}>
Suspended until {new Date(user.suspended_until).toLocaleDateString()} — {user.suspension_reason}
                      </small>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {!isSuspended && user.authorityLevel === "user" && (
                      <button onClick={() => handleSuspend(user.id)} style={btn("#c0392b")}>Suspend</button>
                    )}
                    {isSuspended && (
                      <button onClick={() => handleUnsuspend(user.id)} style={btn("#27ae60")}>Unsuspend</button>
                    )}
                    {user.actionHistory?.length > 0 && (
                       <button
                        onClick={() => setDrillDown({ 
                         type: "history", 
                         title: `@${user.username} History`, 
                         data: user.actionHistory 
                         })}
                        style={btn()}
                         >
                        📋 History
                       </button>
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
                  <img src={prof.profile_pic_url || Cat} alt="pfp" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <strong>@{prof.username}</strong>
                    <small style={{ display: "block", opacity: 0.5 }}>{prof.email}</small>
<small style={{ display: "block", opacity: 0.5 }}>University: {prof.university_code}</small>
                  </div>
                </div>
 
                {prof.proof_file_url && (
                  <a href={prof.proof_file_url} target="_blank" rel="noopener noreferrer"
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
                    <button onClick={() => handleVerifyProfessor(prof.id)} style={btn("#27ae60")}>Verify</button>
                    <button onClick={() => setRejectingId(prof.id)} style={btn("#c0392b")}>Reject</button>
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
      {/* ── RESOURCES TAB ── */}
{activeTab === "resources" && (
  <div>
    <h3 style={{ marginBottom: "16px" }}>Pending Resource Approval</h3>
    {pendingResources.length === 0 ? (
      <p style={{ opacity: 0.5 }}>No pending resources.</p>
    ) : (
      pendingResources.map(post => (
        <div key={post.id} style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <strong>@{post.author_username}</strong>
            <span style={badge("#6476af")}>{post.author_role}</span>
            <small style={{ marginLeft: "auto", opacity: 0.5 }}>{new Date(post.created_at).toLocaleDateString()}</small>
          </div>
          {post.title && <strong style={{ display: "block", marginBottom: "4px" }}>{post.title}</strong>}
          <p style={{ margin: "0 0 10px", opacity: 0.7, fontSize: "13px" }}>{post.content?.slice(0, 120)}</p>

          {post.image_url && (
            <a href={post.image_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", textDecoration: "none", fontSize: "13px", marginBottom: "8px", marginRight: "8px" }}>
              🖼️ View Image
            </a>
          )}
          {post.pdf_url && (
            <a href={post.pdf_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", textDecoration: "none", fontSize: "13px", marginBottom: "8px", marginRight: "8px" }}>
              📄 View PDF
            </a>
          )}
          {post.resource_link && (
            <a href={post.resource_link} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(100,118,175,0.3)", borderRadius: "6px", color: "white", textDecoration: "none", fontSize: "13px", marginBottom: "8px" }}>
              🔗 {post.resource_label || "Open Link"}
            </a>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button onClick={() => handleApproveResource(post.id, true)} style={btn("#27ae60")}>✅ Approve</button>
            <button onClick={() => handleApproveResource(post.id, false)} style={btn("#c0392b")}>❌ Reject</button>
          </div>
        </div>
      ))
    )}
  </div>
)}

{/* ── HIDDEN CONTENT TAB ── */}
{activeTab === "hidden" && (
  <div>
    <h3 style={{ marginBottom: "16px" }}>Hidden Content</h3>
    {hiddenContent.length === 0 ? (
      <p style={{ opacity: 0.5 }}>No hidden content.</p>
    ) : (
      hiddenContent.map(item => (
        <div key={item.id} style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={badge(item.type === "post" ? "#6476af" : "#4a3f6b")}>{item.type}</span>
            <strong>@{item.authorUsername}</strong>
            {item.autoHidden && <span style={badge("#e67e22")}>auto-hidden</span>}
            {!item.autoHidden && <span style={badge("#c0392b")}>manually hidden</span>}
            {item.type === "comment" && (
              <small style={{ opacity: 0.5, fontSize: "11px" }}>in: {item.postTitle || item.postId}</small>
            )}
          </div>
          <p style={{ margin: "0 0 10px", opacity: 0.7, fontSize: "13px" }}>{item.content?.slice(0, 150)}</p>
          {item.reports?.length > 0 && (
            <small style={{ display: "block", opacity: 0.5, marginBottom: "8px" }}>
              🚩 {item.reports.length} report(s)
            </small>
          )}
          <button
            onClick={() => handleRestoreContent(
              item.type,
              item.type === "post" ? item.id : item.postId,
              item.type === "comment" ? item.id : null
            )}
            style={btn("#27ae60")}
          >
            ♻️ Restore
          </button>
        </div>
      ))
    )}
  </div>
)}

{/* ── OTHER INPUTS TAB ── */}
{activeTab === "other" && (
  <div>
    <h3 style={{ marginBottom: "16px" }}>Custom University / Major Validation</h3>
    {otherInputs.length === 0 ? (
      <p style={{ opacity: 0.5 }}>No custom inputs pending.</p>
    ) : (
      otherInputs.map(u => (
        <div key={u.id} style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <strong>@{u.username}</strong>
            <span style={badge("#6476af")}>{u.role}</span>
            <span style={badge(
              u.otherInputStatus === "approved" ? "#27ae60" :
              u.otherInputStatus === "rejected" ? "#c0392b" : "#e67e22"
            )}>{u.otherInputStatus || "pending"}</span>
          </div>
          <small style={{ opacity: 0.5, display: "block", marginBottom: "8px" }}>{u.email}</small>

          {u.customUni && (
            <div style={{ marginBottom: "8px", padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}>
              <small style={{ opacity: 0.6 }}>Custom University:</small>
              <p style={{ margin: "4px 0 0", fontSize: "14px" }}>{u.customUni.name}</p>
              <small style={{ opacity: 0.4 }}>Code: {u.customUni.code}</small>
            </div>
          )}

          {u.customMajors?.length > 0 && (
            <div style={{ marginBottom: "10px", padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}>
              <small style={{ opacity: 0.6 }}>Custom Major(s):</small>
              {u.customMajors.map((m, i) => (
                <p key={i} style={{ margin: "4px 0 0", fontSize: "14px" }}>{m}</p>
              ))}
            </div>
          )}

          {u.otherInputStatus === "pending" && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => handleValidateOtherInput(u.id, true)} style={btn("#27ae60")}>✅ Approve</button>
              <button onClick={() => handleValidateOtherInput(u.id, false)} style={btn("#c0392b")}>❌ Reject</button>
            </div>
          )}
          {u.otherInputStatus !== "pending" && (
            <small style={{ opacity: 0.5 }}>Already {u.otherInputStatus}</small>
          )}
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
                    <small style={{ opacity: 0.5 }}>
                      By @{a.created_by_username} — {new Date(a.created_at).toLocaleString()}
                      </small>
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

      {/* ── REQUEST SUBJECT ROOMS TAB ── */}

      {activeTab === "room-requests" && (
  <div>
    <h3 style={{ marginBottom: "16px" }}>Subject Room Requests</h3>
    {roomRequests.length === 0 ? (
      <p style={{ opacity: 0.5 }}>No pending room requests.</p>
    ) : (
      roomRequests.map(req => (
        <div key={req.id} style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <strong>@{req.username}</strong>
            <span style={badge("#6476af")}>{req.major}</span>
            <small style={{ marginLeft: "auto", opacity: 0.5 }}>
              {new Date(req.requestedAt).toLocaleDateString()}
            </small>
          </div>

          <p style={{ margin: "0 0 4px", fontSize: "14px" }}>
            Subject: <strong>{req.subject}</strong>
          </p>
          <small style={{ opacity: 0.5, display: "block", marginBottom: "10px" }}>
            {req.notifyUsers.length} user(s) waiting on this room
          </small>

          {rejectingRoomId === req.id ? (
            <div>
              <input
                type="text"
                placeholder="Reason for rejection..."
                value={rejectRoomReason}
                onChange={(e) => setRejectRoomReason(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", boxSizing: "border-box", marginBottom: "8px" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleRoomRequest(req.id, false)} style={btn("#c0392b")}>
                  Confirm Reject
                </button>
                <button onClick={() => { setRejectingRoomId(null); setRejectRoomReason(""); }} style={btn("rgba(255,255,255,0.1)")}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              
                <button 
                    onClick={() => handleRoomRequest(req.id, true)} 
                     disabled={roomRequestLoading === req.id}
                     style={btn(roomRequestLoading === req.id ? "#1a6b40" : "#27ae60")}>
                     {roomRequestLoading === req.id ? "Processing..." : "✅ Approve"}
                      </button>
                     <button 
                     onClick={() => { setRejectingRoomId(req.id); setRejectRoomReason(""); }} 
                     disabled={roomRequestLoading === req.id}
                     style={btn("#c0392b")}>
                      ❌ Reject
                        </button>
             </div>
             
           
          )}
        </div>
      ))
    )}
  </div>
)}

{activeTab === "rooms" && (
  <div>
    <h3 style={{ marginBottom: "16px" }}>Room Moderation</h3>
    {moderationRooms.length === 0 ? (
      <p style={{ opacity: 0.5 }}>No rooms assigned.</p>
    ) : (
      <>
      {/* search and filter */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
  <input
    type="text"
    placeholder="Search rooms..."
    value={roomSearch}
    onChange={e => setRoomSearch(e.target.value)}
    style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white" }}
  />
  <select
    value={roomTypeFilter}
    onChange={e => setRoomTypeFilter(e.target.value)}
    style={{ padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "#252b45", color: "white" }}
  >
    <option value="">All Types</option>
    {isSuperAdmin && <option value="public">Public</option>}
    <option value="university">University</option>
    <option value="major">Major</option>
    <option value="subject">Subject</option>
  </select>
</div>
        {/* stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {moderationRooms
             .filter(r => isSuperAdmin ? r.type !== "private" : true)
  .filter(r => roomTypeFilter ? r.type === roomTypeFilter : true)
  .filter(r => roomSearch.trim() ? r.name?.toLowerCase().includes(roomSearch.toLowerCase()) : true)
  .map(room => {
              const activeSuspensions = room.suspendedMembers?.filter(
                s => new Date(s.until) > new Date()
              ).length || 0;
              return (
                <div key={room.id} onClick={() => setSelectedRoom(room)}
                  style={{ ...card, cursor: "pointer", textAlign: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#2f3655"}
                  onMouseLeave={e => e.currentTarget.style.background = "#252b45"}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{
                      ...badge(
                        room.type === "public" ? "#27ae60" :
                        room.type === "subject" ? "#f39c12" :
                        room.type === "university" ? "#6476af" : "#4a3f6b"
                      )
                    }}>{room.type}</span>
                  </div>
                  <strong style={{ display: "block", marginBottom: "6px" }}>{room.name}</strong>
                  <small style={{ opacity: 0.5, display: "block" }}>
                    👥 {room.members?.length || 0} members
                  </small>
                  {activeSuspensions > 0 && (
                    <small style={{ color: "#e74c3c", display: "block", marginTop: "4px" }}>
                      🚫 {activeSuspensions} suspended
                    </small>
                  )}
                </div>
              );
            })}
        </div>
      </>
    )}

    {/* room drill-down modal */}
    {selectedRoom && (
      <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}
          style={{ width: "650px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px" }}>{selectedRoom.name}</h3>
              <small style={{ opacity: 0.5 }}>{selectedRoom.type} • {selectedRoom.members?.length || 0} members</small>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {isSuperAdmin && (
                <button onClick={() => handleDeleteRoom(selectedRoom.id)} style={btn("#7f0000")}>
                  🗑️ Delete Room
                </button>
              )}
              <button onClick={() => setSelectedRoom(null)}
                style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {selectedRoom.members?.length === 0 ? (
              <p style={{ opacity: 0.5 }}>No members.</p>
            ) : (
              selectedRoom.members.map(memberId => {
                const memberUser = users.find(u => u.id === memberId);
                const suspension = selectedRoom.suspendedMembers?.find(
                  s => s.userId === memberId && new Date(s.until) > new Date()
                );
                const isSuspendedInRoom = !!suspension;
                const isSuspending = roomSuspendingId === memberId;

                return (
                  <div key={memberId} style={{ ...card, marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "13px" }}>
                            {memberUser ? `@${memberUser.username}` : memberId}
                          </strong>
                          {memberUser && <span style={badge("#6476af")}>{memberUser.role}</span>}
                          {isSuspendedInRoom && <span style={badge("#c0392b")}>suspended in room</span>}
                        </div>
                        {isSuspendedInRoom && (
                          <small style={{ color: "#e74c3c", display: "block", marginTop: "2px" }}>
                            Until {new Date(suspension.until).toLocaleDateString()} — {suspension.reason}
                          </small>
                        )}
                        {memberUser?.roomViolations?.[selectedRoom.id] > 0 && (
                          <small style={{ opacity: 0.5, display: "block" }}>
                            Room violations: {memberUser.roomViolations[selectedRoom.id]}
                          </small>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        {!isSuspendedInRoom ? (
                          <button onClick={() => setRoomSuspendingId(memberId)} style={btn("#c0392b")}>
                            Suspend
                          </button>
                        ) : (
                          <button onClick={() => handleRoomUnsuspend(selectedRoom.id, memberId)} style={btn("#27ae60")}>
                            Unsuspend
                          </button>
                        )}
                      </div>
                    </div>

                    {/* suspend form */}
                    {isSuspending && (
                      <div style={{ marginTop: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "10px" }}>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                          <input
                            type="number"
                            placeholder="Days..."
                            value={roomSuspendDays}
                            onChange={e => setRoomSuspendDays(e.target.value)}
                            style={{ width: "80px", padding: "6px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white" }}
                          />
                          <input
                            type="text"
                            placeholder="Reason..."
                            value={roomSuspendReason}
                            onChange={e => setRoomSuspendReason(e.target.value)}
                            style={{ flex: 1, padding: "6px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleRoomSuspend(selectedRoom.id, memberId)} style={btn("#c0392b")}>
                            Confirm
                          </button>
                          <button onClick={() => { setRoomSuspendingId(null); setRoomSuspendDays(""); setRoomSuspendReason(""); }} style={btn("rgba(255,255,255,0.1)")}>
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
        </div>
      </div>
    )}
  </div>
)}

      {drillDown && (
  <div className="modal-overlay" onClick={() => setDrillDown(null)}>
    <div className="modal" onClick={e => e.stopPropagation()}
      style={{ width: "650px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
      
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0 }}>{drillDown.title}</h3>
        <button onClick={() => setDrillDown(null)}
          style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>

        {/* USERS */}
        {drillDown.type === "users" && drillDown.data.map(u => {
const isSuspended = u.suspended_until && new Date(u.suspended_until) > new Date();
          return (
            <div key={u.id} style={{ ...card, display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={u.profile_pic_url || Cat} alt="pfp"
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <strong>@{u.username}</strong>
                  <span style={badge("#6476af")}>{u.role}</span>
                  {isSuspended && <span style={badge("#c0392b")}>suspended</span>}
                  {u.verificationStatus === "pending" && <span style={badge("#e67e22")}>pending</span>}
                </div>
                <small style={{ opacity: 0.5 }}>{u.email} • rating: {u.rating ?? 1}/5 • violations: {u.violation_count || 0}</small>
                {isSuspended && (
                  <small style={{ display: "block", color: "#e74c3c", marginTop: "2px" }}>
Until {new Date(u.suspended_until).toLocaleDateString()} — {u.suspension_reason}
                  </small>
                )}
              </div>
              {/* action history button */}
              {u.actionHistory?.length > 0 && (
                <button onClick={() => setDrillDown({ type: "history", title: `@${u.username} History`, data: u.actionHistory })}
                  style={btn()}>📋 History</button>
              )}
            </div>
          );
        })}

        {/* POSTS */}
        {drillDown.type === "posts" && drillDown.data.map(post => (
          <div key={post.id} style={card}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
              <strong>@{post.authorUsername}</strong>
              <span style={badge("#6476af")}>{post.authorRole}</span>
              {post.isHidden && <span style={badge("#c0392b")}>hidden</span>}
              {post.reports?.length > 0 && <span style={badge("#e67e22")}>🚩 {post.reports.length}</span>}
              <small style={{ marginLeft: "auto", opacity: 0.5 }}>{new Date(post.created_at).toLocaleDateString()}</small>
            </div>
            {post.title && <strong style={{ display: "block", marginBottom: "4px" }}>{post.title}</strong>}
            <p style={{ margin: 0, opacity: 0.7, fontSize: "13px" }}>{post.content?.slice(0, 120)}...</p>
            <small style={{ opacity: 0.4 }}>💬 {post.comments?.length || 0} comments • 👍 {post.votes?.useful || 0} • 👎 {post.votes?.useless || 0}</small>
          </div>
        ))}

        {/* COMMENTS */}
        {drillDown.type === "comments" && drillDown.data.map(comment => (
          <div key={comment.id} style={card}> 
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
              <strong>@{comment.authorUsername}</strong>
              {comment.isHidden && <span style={badge("#c0392b")}>hidden</span>}
              {comment.reports?.length > 0 && <span style={badge("#e67e22")}>🚩 {comment.reports.length}</span>}
              <small style={{ marginLeft: "auto", opacity: 0.5 }}>{new Date(comment.createdAt).toLocaleDateString()}</small>
            </div>
            <p style={{ margin: "0 0 4px", opacity: 0.7, fontSize: "13px" }}>{comment.content?.slice(0, 120)}</p>
            <small style={{ opacity: 0.4 }}>In post: {comment.postTitle}</small>
          </div>
        ))}

        {/* ROOMS */}
        {drillDown.type === "rooms" && drillDown.data.map(room => (
          <div key={room.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{room.name}</strong>
              <small style={{ display: "block", opacity: 0.5, marginTop: "4px" }}>
                Type: {room.type} • Members: {room.members?.length || 0}
                {room.university && ` • Uni: ${room.university}`}
                {room.major && ` • Major: ${room.major}`}
              </small>
            </div>
            <span style={badge(
              room.type === "public" ? "#27ae60" :
              room.type === "private" ? "#c0392b" :
              room.type === "subject" ? "#f39c12" : "#6476af"
            )}>{room.type}</span>
          </div>
        ))}

        {/* ACTION HISTORY */}
        {drillDown.type === "history" && drillDown.data.map((entry, i) => (
          <div key={i} style={{ ...card, display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6476af", marginTop: "6px", flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: "13px" }}>{entry.action}</strong>
              {entry.by && <small style={{ display: "block", opacity: 0.5 }}>By @{entry.by}</small>}
              {entry.reason && <small style={{ display: "block", opacity: 0.5 }}>Reason: {entry.reason}</small>}
              <small style={{ opacity: 0.4 }}>{new Date(entry.date).toLocaleString()}</small>
            </div>
          </div>
        ))}

        {drillDown.data?.length === 0 && (
          <p style={{ opacity: 0.5, textAlign: "center" }}>Nothing to show.</p>
        )}

      </div>
    </div>
  </div>
)}
 
    </div>
  );
}