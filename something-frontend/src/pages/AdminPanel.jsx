
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.js";
import "../styles/admin.css"; 
import api from "../api/axios.js";

const API = "/admin";

export default function AdminPanel() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [activeTab, setActiveTab] = useState("announcements");

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

  const [userPermissions, setUserPermissions] = useState([]);

  const [actionLoading, setActionLoading] = useState(false);
  //////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        // const res = await axios.get(
        //   "http://localhost:5000/api/users/me/permissions",
        //   { headers },
        // );
        const res = await api.get("/users/me/permissions");
        setUserPermissions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPermissions();
  }, []);

  useEffect(() => {
    const level = currentUser?.authorityLevel;
    if (level !== "admin" && level !== "superadmin") {
      alert(t("adminPanel.sessionOutdated"));
      navigate("/dashboard");
    }
  }, []);

  useEffect(() => {
    //if (activeTab === "stats") fetchStats();
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
      //const res = await axios.get(`${API}/stats`, { headers });
      const res = await api.get(`${API}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch) params.append("q", userSearch);
      if (userRoleFilter) params.append("role", userRoleFilter);
      if (userStatusFilter) params.append("status", userStatusFilter);
      // const res = await axios.get(`${API}/users?${params}`, { headers });
      const res = await api.get(`${API}/users?${params}`);
      setUsers(res.data);
      // console.log("user sample:", res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingProfessors = async () => {
    try {
      // const res = await axios.get(`${API}/professors/pending`, { headers });
      const res = await api.get(`${API}/professors/pending`);
      setPendingProfessors(res.data);
      // console.log("prof sample:", res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  //just noting that this might be a problem causer....
  const fetchReports = async () => {
    try {
      // const res = await axios.get(`${API}/reports`, { headers });
      const res = await api.get(`${API}/reports`);
      const flat = [
        ...res.data.posts.map((p) => ({ ...p, type: "post" })),
        ...res.data.comments.map((c) => ({ ...c, type: "comment" })),
      ];
      setReports(flat);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      // const res = await axios.get(`${API}/announcements`);
      const res = await api.get(`${API}/announcements`);
      setAnnouncements(res.data);
      // console.log("announcements raw:", res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuspend = async (userId) => {
    const days = prompt(t("adminPanel.users.suspendDaysPrompt"))
    if (!days) return;
    const reason = prompt(t("adminPanel.users.suspendReasonPrompt"))
    if (!reason) return;
    setActionLoading(true);
    try {
      // await axios.patch(
      //   `${API}/users/${userId}/suspend`,
      //   { days: Number(days), reason },
      //   { headers },
      // );
      await api.patch(`${API}/users/${userId}/suspend`, { days: Number(days), reason });
      alert(t("adminPanel.users.suspendSuccess"))
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (userId) => {
    setActionLoading(true);
    try {
      // await axios.patch(`${API}/users/${userId}/unsuspend`, {}, { headers });
      await api.patch(`${API}/users/${userId}/unsuspend`, {});
      alert(t("adminPanel.users.unsuspendSuccess"))
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyProfessor = async (userId) => {
    setActionLoading(true);
    try {
      // await axios.patch(`${API}/professors/${userId}/verify`, {}, { headers });
      await api.patch(`${API}/professors/${userId}/verify`, {});
      alert(t("adminPanel.professors.verifySuccess"));
      fetchPendingProfessors();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProfessor = async (userId) => {
    if (!rejectReason.trim()) return alert(t("adminPanel.professors.rejectReasonRequired"));
    setActionLoading(true);
    try {
      // await axios.patch(
      //   `${API}/professors/${userId}/reject`,
      //   { reason: rejectReason },
      //   { headers },
      // );
      await api.patch(`${API}/professors/${userId}/reject`, { reason: rejectReason });
      alert(t("adminPanel.professors.rejectSuccess"));
      setRejectingId(null);
      setRejectReason("");
      fetchPendingProfessors();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHideContent = async (type, postId, commentId) => {
    if (!window.confirm(t("adminPanel.reports.hideContent") + ` this ${type}?`)) return;
    setActionLoading(true);
    try {
      // await axios.patch(
      //   `${API}/content/hide`,
      //   { type, postId, commentId },
      //   { headers },
      // );
      await api.patch(`${API}/content/hide`, { type, postId, commentId });
      alert("Content hidden.");

      setReports((prev) =>
        prev.map((item) => {
          if (type === "post" && item.type === "post" && item.id === postId) {
            return { ...item, isHidden: true };
          }
          if (
            type === "comment" &&
            item.type === "comment" &&
            item.id === commentId
          ) {
            return { ...item, isHidden: true };
          }
          return item;
        }),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    setActionLoading(true);
    try {
      // await axios.post(
      //   `${API}/announcements`,
      //   { message: newAnnouncement },
      //   { headers },
      // );
      await api.post(`${API}/announcements`, { message: newAnnouncement });
      setNewAnnouncement("");
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm(t("adminPanel.announcements.deleteConfirm"))) return;
    try {
      // await axios.delete(`${API}/announcements/${id}`, { headers });
      await api.delete(`${API}/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
  };

  const handleApproveResource = async (postId, approved) => {
    setActionLoading(true);
    try {
      // await axios.patch(
      //   `${API}/content/resource`,
      //   { postId, approved },
      //   { headers },
      // );
      await api.patch(`${API}/content/resource`, { postId, approved });
      fetchPendingResources();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreContent = async (type, postId, commentId = null) => {
    if (!window.confirm(t("adminPanel.hidden.restore") + ` this ${type}?`)) return;
    setActionLoading(true);
    try {
      // await axios.patch(
      //   `${API}/content/restore`,
      //   { type, postId, commentId },
      //   { headers },
      // );
      await api.patch(`${API}/content/restore`, { type, postId, commentId });
      fetchHiddenContent();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateOtherInput = async (userId, approved) => {
    setActionLoading(true);
    try {
      // await axios.patch(
      //   `${API}/other-inputs/validate`,
      //   { userId, approved },
      //   { headers },
      // );
      await api.patch(`${API}/other-inputs/validate`, { userId, approved });
      fetchOtherInputs();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

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
    { id: "announcements", label: t("adminPanel.tabs.announcements") },
    ...(isSuperAdmin || userPermissions.includes("SUSPEND_USERS")
      ? [{ id: "users", label: t("adminPanel.tabs.users") }]
      : []),
    ...(isSuperAdmin || userPermissions.includes("VERIFY_PROFESSORS")
      ? [{ id: "professors", label: t("adminPanel.tabs.professors") }]
      : []),
    ...(isSuperAdmin || userPermissions.includes("HANDLE_REPORTS")
      ? [{ id: "reports", label: t("adminPanel.tabs.reports") }]
      : []),
    ...(isSuperAdmin || userPermissions.includes("APPROVE_RESOURCES")
      ? [{ id: "resources", label: t("adminPanel.tabs.resources") }]
      : []),
    ...(isSuperAdmin || userPermissions.includes("MODERATE_CONTENT")
      ? [{ id: "hidden", label: t("adminPanel.tabs.hidden") }]
      : []),
    ...(isSuperAdmin || userPermissions.includes("VALIDATE_OTHER")
      ? [{ id: "other", label: t("adminPanel.tabs.other") }]
      : []),
    ...(isSuperAdmin || userPermissions.includes("MANAGE_ROOMS")
      ? [
          { id: "room-requests", label: t("adminPanel.tabs.roomRequests") },
          { id: "rooms", label: t("adminPanel.tabs.rooms") },
        ]
      : []),
  ];

  const fetchDrillDown = async (type) => {
    try {
      switch (type) {
        case "users": {
         // const res = await axios.get(`${API}/users`, { headers });
         const res = await api.get(`${API}/users`);
          setDrillDown({ type: "users", title: "All Users", data: res.data });
          break;
        }
        case "suspended": {
          // const res = await axios.get(`${API}/users?status=suspended`, {
          //   headers,
          // });
          const res = await api.get(`${API}/users?status=suspended`);
          setDrillDown({
            type: "users",
            title: "Suspended Users",
            data: res.data,
          });
          break;
        }
        case "posts": {
          // const res = await axios.get(`${API}/posts`, { headers });
          const res = await api.get(`${API}/posts`);

          setDrillDown({ type: "posts", title: "All Posts", data: res.data });
          break;
        }
        case "comments": {
          // const res = await axios.get(`${API}/posts`, { headers });
          const res = await api.get(`${API}/posts`);
          const comments = [];
          res.data.forEach((post) => {
            post.comments?.forEach((c) =>
              comments.push({ ...c, postTitle: post.title || "Untitled" }),
            );
          });
          setDrillDown({
            type: "comments",
            title: "All Comments",
            data: comments,
          });
          break;
        }
        case "rooms": {
          // const res = await axios.get(`${API}/rooms`, { headers });
          const res = await api.get(`${API}/rooms`);
          setDrillDown({ type: "rooms", title: "All Rooms", data: res.data });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingResources = async () => {
    try {
      // const res = await axios.get(`${API}/resources/pending`, { headers });
      const res = await api.get(`${API}/resources/pending`);
      setPendingResources(res.data);
      // console.log("resource sample:", res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHiddenContent = async () => {
    try {
      // const res = await axios.get(`${API}/content/hidden`, { headers });
      const res = await api.get(`${API}/content/hidden`);
      const flat = [
        ...res.data.posts.map((p) => ({ ...p, type: "post" })),
        ...res.data.comments.map((c) => ({ ...c, type: "comment" })),
      ];
      setHiddenContent(flat);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOtherInputs = async () => {
    try {
      // const res = await axios.get(`${API}/other-inputs`, { headers });
      const res = await api.get(`${API}/other-inputs`);
      // console.log("other inputs raw:", res.data);
      setOtherInputs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoomRequests = async () => {
    try {
      // const res = await axios.get(`${API}/room-requests`, { headers });
      const res = await api.get(`${API}/room-requests`);
      setRoomRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomRequest = async (requestId, approved) => {
    if (!approved && !rejectRoomReason.trim())
      return alert(t("adminPanel.roomRequests.rejectReasonRequired"))
    setRoomRequestLoading(requestId);
    try {
      // await axios.post(
      //   `${API}/room-requests/handle`,
      //   { requestId, approved, reason: rejectRoomReason },
      //   { headers },
      // );
      await api.post(`${API}/room-requests/handle`, { requestId, approved, reason: rejectRoomReason });
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
      // const [roomsRes, usersRes] = await Promise.all([
      //   axios.get(`${API}/rooms-moderation`, { headers }),
      //   axios.get(`${API}/users`, { headers }),
      // ]);
      const [roomsRes, usersRes] = await Promise.all([
  api.get(`${API}/rooms-moderation`),
  api.get(`${API}/users`),
]);
      // console.log("room sample:", roomsRes.data[0]);
      setModerationRooms(roomsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoomSuspend = async (roomId, userId) => {
    if (!roomSuspendDays || !roomSuspendReason.trim())
      return alert(t("adminPanel.rooms.suspendFieldsRequired"));
    setActionLoading(true);
    try {
      // await axios.patch(
      //   `${API}/rooms-moderation/suspend`,
      //   {
      //     roomId,
      //     userId,
      //     days: Number(roomSuspendDays),
      //     reason: roomSuspendReason,
      //   },
      //   { headers },
      // );
      await api.patch(`${API}/rooms-moderation/suspend`, { roomId, userId, days: Number(roomSuspendDays), reason: roomSuspendReason });
      setRoomSuspendingId(null);
      setRoomSuspendDays("");
      setRoomSuspendReason("");
      // const [roomsRes, usersRes] = await Promise.all([
      //   axios.get(`${API}/rooms-moderation`, { headers }),
      //   axios.get(`${API}/users`, { headers }),
      // ]);
      const [roomsRes, usersRes] = await Promise.all([
  api.get(`${API}/rooms-moderation`),
  api.get(`${API}/users`),
]);
      setModerationRooms(roomsRes.data);
      setUsers(usersRes.data);
      setSelectedRoom(roomsRes.data.find((r) => r.id === roomId));
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoomUnsuspend = async (roomId, userId) => {
    setActionLoading(true);
    try {
      // await axios.patch(
      //   `${API}/rooms-moderation/unsuspend`,
      //   { roomId, userId },
      //   { headers },
      // );
      await api.patch(`${API}/rooms-moderation/unsuspend`, { roomId, userId });
      const [roomsRes, usersRes] = await Promise.all([
      //   axios.get(`${API}/rooms-moderation`, { headers }),
      //   axios.get(`${API}/users`, { headers }),
      // ]);
        api.get(`${API}/rooms-moderation`),
  api.get(`${API}/users`),
]);
      setModerationRooms(roomsRes.data);
      setUsers(usersRes.data);
      setSelectedRoom(roomsRes.data.find((r) => r.id === roomId));
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm(t("adminPanel.rooms.deleteConfirm"))) return;
    try {
      // await axios.delete(`${API}/rooms-moderation/${roomId}`, { headers });

await api.delete(`${API}/rooms-moderation/${roomId}`);
      setSelectedRoom(null);
      fetchModerationRooms();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="adminpanel-container">
      {/* header */}
      <div className="adminpanel-header">
       <button
  onClick={() => window.location.href = "/dashboard"}
  style={{
    marginBottom: "20px",
    padding: "8px 16px",
    background: "#6476af",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px"
  }}
>
  ← 
</button>
        <div>
          <h2 className="adminpanel-title">{t("adminPanel.title")}</h2>
          <small className="adminpanel-subtitle">
            @{currentUser?.username} — {currentUser?.authorityLevel}
          </small>
        </div>
        {/* {isSuperAdmin && (
          <button
            onClick={() => navigate("/superadmin")}
            className="adminpanel-superadmin-btn"
          >
            {t("adminPanel.superAdminBtn")}
          </button>
        )} */}
      </div>

      {/* tabs */}
      <div className="adminpanel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`adminpanel-tab ${activeTab === tab.id ? "adminpanel-tab-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div>
          <h3 className="adminpanel-mb-16">
            {t("adminPanel.users.title")}
          </h3>

          {/* filters */}
          <div className="adminpanel-filters">
            <input
              type="text"
              placeholder={t("adminPanel.users.searchPlaceholder")}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="adminpanel-search-input"
            />
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="adminpanel-select"
            >
              <option value="">{t("adminPanel.users.allRoles")}</option>
              <option value="student">{t("adminPanel.users.student")}</option>
              <option value="professor">
                {t("adminPanel.users.professor")}
              </option>
            </select>
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="adminpanel-select"
            >
              <option value="">{t("adminPanel.users.allStatus")}</option>
              <option value="suspended">
                {t("adminPanel.users.suspended")}
              </option>
              <option value="pending">
                {t("adminPanel.users.pendingVerification")}
              </option>
            </select>
            <button onClick={fetchUsers} className="adminpanel-btn adminpanel-btn-primary">
              {t("adminPanel.users.searchBtn")}
            </button>
          </div>

          {users.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.users.noUsers")}</p>
          ) : (
            users.map((user) => {
              const isSuspended =
                user.suspended_until &&
                new Date(user.suspended_until) > new Date();
              return (
                <div
                  key={user.id}
                  className="adminpanel-card adminpanel-item-row"
                >
                  <img
                    src={user.profile_pic_url || Cat}
                    alt="pfp"
                    className="adminpanel-profile-img"
                  />
                  <div className="adminpanel-item-flex">
                    <div className="adminpanel-item-header">
                      <strong className="adminpanel-username">@{user.username}</strong>
                      <span className="adminpanel-badge adminpanel-badge-primary">{user.role}</span>
                      {user.authority_level !== "user" && (
                        <span className="adminpanel-badge adminpanel-badge-dark">
                          {user.authority_level}
                        </span>
                      )}
                      {isSuspended && (
                        <span className="adminpanel-badge adminpanel-badge-danger">
                          {t("adminPanel.users.suspended")}
                        </span>
                      )}
                      {user.verification_status === "pending" && (
                        <span className="adminpanel-badge adminpanel-badge-pending">
                          {t("adminPanel.users.pendingProf")}
                        </span>
                      )}
                    </div>
                    <small className="adminpanel-item-details">
                      {user.email} • {t("adminPanel.users.rating")}: {user.rating ?? 1}/5 • {t("adminPanel.users.violations")}:{" "}
                      {user.violation_count || 0} 
                    </small>
                    {isSuspended && (
                      <small className="adminpanel-suspension-text">
                        {`${t("adminPanel.users.suspendedUntil")} ${new Date(user.suspended_until).toLocaleDateString()} — ${user.suspension_reason}`}
                      </small>
                    )}
                  </div>
                  <div className="adminpanel-button-group">
                    {!isSuspended && user.authorityLevel === "user" && (
                      <button
                        onClick={() => handleSuspend(user.id)}
                        disabled={actionLoading}
                        className="adminpanel-btn adminpanel-btn-danger"
                      >
                        {t("adminPanel.users.suspend")}
                      </button>
                    )}
                    {isSuspended && (
                      <button
                        onClick={() => handleUnsuspend(user.id)}
                        disabled={actionLoading}
                        className="adminpanel-btn adminpanel-btn-success"
                      >
                        {t("adminPanel.users.unsuspend")}
                      </button>
                    )}
                    {user.actionHistory?.length > 0 && (
                      <button
                        onClick={() =>
                          setDrillDown({
                            type: "history",
                            title: `@${user.username} History`,
                            data: user.actionHistory,
                          })
                        }
                        className="adminpanel-btn adminpanel-btn-primary"
                      >
                        {t("adminPanel.users.history")}
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
          <h3 className="adminpanel-mb-16">
            {t("adminPanel.professors.title")}
          </h3>
          {pendingProfessors.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.professors.noPending")}</p>
          ) : (
            pendingProfessors.map((prof) => (
              <div key={prof.id} className="adminpanel-card">
                <div className="adminpanel-item-row adminpanel-mb-16">
                  <img
                    src={prof.profile_pic_url || Cat}
                    alt="pfp"
                    className="adminpanel-profile-img"
                  />
                  <div>
                    <strong>@{prof.username}</strong>
                    <small className="adminpanel-item-details" style={{ display: "block" }}>
                      {prof.email}
                    </small>
                    <small className="adminpanel-item-details" style={{ display: "block" }}>
                      {`${t("adminPanel.professors.university")}: ${prof.university_code}`}
                    </small>
                  </div>
                </div>

                {prof.proof_file_url && (
                  <a
                    href={prof.proof_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adminpanel-proof-link"
                  >
                    {t("adminPanel.professors.viewProof")}
                  </a>
                )}

                {rejectingId === prof.id ? (
                  <div className="adminpanel-inline-form">
                    <input
                      type="text"
                      placeholder={t("adminPanel.professors.rejectPlaceholder")}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="adminpanel-input"
                      style={{ marginBottom: "8px" }}
                    />
                    <div className="adminpanel-button-group">
                      <button
                        onClick={() => handleRejectProfessor(prof.id)}
                        disabled={actionLoading}
                        className="adminpanel-btn adminpanel-btn-danger"
                      >
                        {actionLoading ? t("adminPanel.professors.rejecting") : t("adminPanel.professors.confirmReject")}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="adminpanel-btn adminpanel-btn-gray"
                      >
                        {t("adminPanel.professors.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="adminpanel-button-group">
                    <button
                      onClick={() => handleVerifyProfessor(prof.id)}
                      disabled={actionLoading}
                      className="adminpanel-btn adminpanel-btn-success"
                    >
                      {actionLoading ? t("adminPanel.professors.verifying") : t("adminPanel.professors.verify")}
                    </button>
                    <button
                      onClick={() => setRejectingId(prof.id)}
                      disabled={actionLoading}
                      className="adminpanel-btn adminpanel-btn-danger"
                    >
                      {t("adminPanel.professors.reject")}
                    </button>
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
          <h3 className="adminpanel-mb-16">{t("adminPanel.reports.title")}</h3>
          {reports.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.reports.noReports")}</p>
          ) : (
            reports.map((item) => (
              <div key={item.id} className="adminpanel-card">
                <div className="adminpanel-item-header">
                  <span className={`adminpanel-badge ${item.type === "post" ? "adminpanel-badge-primary" : "adminpanel-badge-dark"}`}>
                    {item.type}
                  </span>
                  <strong>@{item.author_username}</strong>
                  <span className="adminpanel-item-details" style={{ marginLeft: "auto", fontSize: "12px" }}>
                    {`${item.reports?.length} ${t("adminPanel.reports.reports")}`}
                  </span>
                </div>
                <p className="adminpanel-drill-content">
                  {item.content?.slice(0, 150)}
                </p>
                <div style={{ marginBottom: "10px" }}>
                  {item.reports?.map((r, i) => (
                    <small
                      key={i}
                      className="adminpanel-item-details"
                      style={{ display: "block", fontSize: "11px" }}
                    >
                      — {r.reason} ({new Date(r.createdAt).toLocaleDateString()})
                    </small>
                  ))}
                </div>
                {!item.isHidden && (
                  <button
                    onClick={() =>
                      handleHideContent(
                        item.type,
                        item.type === "post" ? item.id : item.postId,
                        item.type === "comment" ? item.id : null,
                      )
                    }
                    className="adminpanel-btn adminpanel-btn-danger"
                    disabled={actionLoading}
                  >
                    {actionLoading ? t("adminPanel.reports.hiding") : t("adminPanel.reports.hideContent")}
                  </button>
                )}
                {item.isHidden && (
                  <span style={{ color: "#e74c3c", fontSize: "12px" }}>
                    {t("adminPanel.reports.alreadyHidden")}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* ── RESOURCES TAB ── */}
      {activeTab === "resources" && (
        <div>
          <h3 className="adminpanel-mb-16">{t("adminPanel.resources.title")}</h3>
          {pendingResources.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.resources.noPending")}</p>
          ) : (
            pendingResources.map((post) => (
              <div key={post.id} className="adminpanel-card">
                <div className="adminpanel-item-header">
                  <strong>@{post.author_username}</strong>
                  <span className="adminpanel-badge adminpanel-badge-primary">{post.author_role}</span>
                  <small className="adminpanel-item-details" style={{ marginLeft: "auto" }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </small>
                </div>
                {post.title && (
                  <strong style={{ display: "block", marginBottom: "4px" }}>
                    {post.title}
                  </strong>
                )}
                <p className="adminpanel-drill-content" style={{ marginBottom: "10px" }}>
                  {post.content?.slice(0, 120)}
                </p>

                {post.image_url && (
                  <a
                    href={post.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adminpanel-resource-link"
                  >
                    {t("adminPanel.resources.viewImage")}
                  </a>
                )}
                {post.pdf_url && (
                  <a
                    href={post.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adminpanel-resource-link"
                  >
                    {t("adminPanel.resources.viewPdf")}
                  </a>
                )}
                {post.resource_link && (
                  <a
                    href={post.resource_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="adminpanel-resource-link adminpanel-resource-link-external"
                  >
                    🔗 {post.resource_label || t("adminPanel.resources.openLink")}
                  </a>
                )}

                <div className="adminpanel-button-group" style={{ marginTop: "10px" }}>
                  <button
                    onClick={() => handleApproveResource(post.id, true)}
                    disabled={actionLoading}
                    className="adminpanel-btn adminpanel-btn-success"
                  >
                    {actionLoading ? "..." : t("adminPanel.resources.approve")}
                  </button>
                  <button
                    onClick={() => handleApproveResource(post.id, false)}
                    disabled={actionLoading}
                    className="adminpanel-btn adminpanel-btn-danger"
                  >
                    {actionLoading ? "..." : t("adminPanel.resources.reject")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── HIDDEN CONTENT TAB ── */}
      {activeTab === "hidden" && (
        <div>
          <h3 className="adminpanel-mb-16">{t("adminPanel.hidden.title")}</h3>
          {hiddenContent.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.hidden.noHidden")}</p>
          ) : (
            hiddenContent.map((item) => (
              <div key={item.id} className="adminpanel-card">
                <div className="adminpanel-item-header">
                  <span className={`adminpanel-badge ${item.type === "post" ? "adminpanel-badge-primary" : "adminpanel-badge-dark"}`}>
                    {item.type}
                  </span>
                  <strong>@{item.author_username}</strong>
                  {item.autoHidden && (
                    <span className="adminpanel-badge adminpanel-badge-pending">{t("adminPanel.hidden.autoHidden")}</span>
                  )}
                  {!item.autoHidden && (
                    <span className="adminpanel-badge adminpanel-badge-danger">{t("adminPanel.hidden.manuallyHidden")}</span>
                  )}
                  {item.type === "comment" && (
                    <small className="adminpanel-item-details" style={{ fontSize: "11px" }}>
                      in: {item.postTitle || item.postId}
                    </small>
                  )}
                </div>
                <p className="adminpanel-drill-content" style={{ marginBottom: "10px" }}>
                  {item.content?.slice(0, 150)}
                </p>
                {item.reports?.length > 0 && (
                  <small className="adminpanel-item-details" style={{ display: "block", marginBottom: "8px" }}>
                    {` ${item.reports.length} ${t("adminPanel.hidden.reports")}`}
                  </small>
                )}
                <button
                  onClick={() =>
                    handleRestoreContent(
                      item.type,
                      item.type === "post" ? item.id : item.postId,
                      item.type === "comment" ? item.id : null,
                    )
                  }
                  disabled={actionLoading}
                  className="adminpanel-btn adminpanel-btn-success"
                >
                  {actionLoading ? t("adminPanel.hidden.restoring") : t("adminPanel.hidden.restore")}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── OTHER INPUTS TAB ── */}
      {activeTab === "other" && (
        <div>
          <h3 className="adminpanel-mb-16">
            {t("adminPanel.other.title")}
          </h3>
          {otherInputs.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.other.noPending")}</p>
          ) : (
            otherInputs.map((u) => (
              <div key={u.id} className="adminpanel-card">
                <div className="adminpanel-item-header">
                  <strong>@{u.username}</strong>
                  <span className="adminpanel-badge adminpanel-badge-primary">{u.role}</span>
                  <span className={`adminpanel-badge ${
                    u.otherInputStatus === "approved"
                      ? "adminpanel-badge-success"
                      : u.otherInputStatus === "rejected"
                        ? "adminpanel-badge-danger"
                        : "adminpanel-badge-pending"
                  }`}>
                    {u.otherInputStatus || "pending"}
                  </span>
                </div>
                <small className="adminpanel-item-details" style={{ display: "block", marginBottom: "8px" }}>
                  {u.email}
                </small>

                {u.customUni && (
                  <div className="adminpanel-custom-section">
                    <small className="adminpanel-custom-label">{t("adminPanel.other.customUni")}</small>
                    <p className="adminpanel-custom-value">
                      {u.customUni.name}
                    </p>
                    <small className="adminpanel-custom-code">
                      {`${t("adminPanel.other.code")}: ${u.customUni.code}`}
                    </small>
                  </div>
                )}

                {u.customMajors?.length > 0 && (
                  <div className="adminpanel-custom-section">
                    <small className="adminpanel-custom-label">{t("adminPanel.other.customMajors")}</small>
                    {u.customMajors.map((m, i) => (
                      <p key={i} className="adminpanel-custom-value">
                        {m}
                      </p>
                    ))}
                  </div>
                )}

                {u.otherInputStatus === "pending" && (
                  <div className="adminpanel-button-group">
                    <button
                      onClick={() => handleValidateOtherInput(u.id, true)}
                      disabled={actionLoading}
                      className="adminpanel-btn adminpanel-btn-success"
                    >
                      {actionLoading ? "..." : t("adminPanel.other.approve")}
                    </button>
                    <button
                      onClick={() => handleValidateOtherInput(u.id, false)}
                      disabled={actionLoading}
                      className="adminpanel-btn adminpanel-btn-danger"
                    >
                      {actionLoading ? "..." : t("adminPanel.other.reject")}
                    </button>
                  </div>
                )}
                {u.otherInputStatus !== "pending" && (
                  <small className="adminpanel-item-details">
                    {`${t("adminPanel.other.alreadyProcessed")} ${u.otherInputStatus}`}
                  </small>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ANNOUNCEMENTS TAB ── */}
      {activeTab === "announcements" && (
        <div>
          <h3 className="adminpanel-mb-16">{t("adminPanel.announcements.title")}</h3>

          {isSuperAdmin && (
            <div className="adminpanel-card" style={{ marginBottom: "20px" }}>
              <textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder={t("adminPanel.announcements.placeholder")}
                className="adminpanel-textarea"
              />
              <button
                onClick={handleCreateAnnouncement}
                disabled={!newAnnouncement.trim() || actionLoading}
                className="adminpanel-btn adminpanel-btn-primary"
              >
                {actionLoading ? t("adminPanel.announcements.posting") : t("adminPanel.announcements.post")}
              </button>
            </div>
          )}

          {announcements.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.announcements.noAnnouncements")}</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="adminpanel-card">
                <div className="adminpanel-announcement-header">
                  <div>
                    <p className="adminpanel-announcement-message">{a.message}</p>
                    <small className="adminpanel-announcement-meta">
                      By @{a.created_by_username} —{" "}
                      {new Date(a.created_at).toLocaleString()}
                    </small>
                  </div>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="adminpanel-delete-btn"
                    >
                      🗑️
                    </button>
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
          <h3 className="adminpanel-mb-16">{t("adminPanel.roomRequests.title")}</h3>
          {roomRequests.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.roomRequests.noPending")}</p>
          ) : (
            (roomRequests ?? []).map((req) => (
              <div key={req.id} className="adminpanel-card">
                <div className="adminpanel-item-header">
                  <strong>@{req.username}</strong>
                  <span className="adminpanel-badge adminpanel-badge-primary">{req.major}</span>
                  <small className="adminpanel-item-details" style={{ marginLeft: "auto" }}>
                    {new Date(req.requested_at).toLocaleDateString()}
                  </small>
                </div>

                <p style={{ margin: "0 0 4px", fontSize: "14px" }}>
                  {`${t("adminPanel.roomRequests.subject")}: `}<strong>{req.subject}</strong>
                </p>
                <small className="adminpanel-item-details" style={{ display: "block", marginBottom: "10px" }}>
                  {`${req.notifyUsers?.length ?? 0} ${t("adminPanel.roomRequests.usersWaiting")}`}
                </small>

                {rejectingRoomId === req.id ? (
                  <div>
                    <input
                      type="text"
                      placeholder={t("adminPanel.roomRequests.rejectPlaceholder")}
                      value={rejectRoomReason}
                      onChange={(e) => setRejectRoomReason(e.target.value)}
                      className="adminpanel-input"
                      style={{ marginBottom: "8px" }}
                    />
                    <div className="adminpanel-button-group">
                      <button
                        onClick={() => handleRoomRequest(req.id, false)}
                        className="adminpanel-btn adminpanel-btn-danger"
                      >
                        {t("adminPanel.roomRequests.confirmReject")}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingRoomId(null);
                          setRejectRoomReason("");
                        }}
                        className="adminpanel-btn adminpanel-btn-gray"
                      >
                        {t("adminPanel.roomRequests.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="adminpanel-button-group">
                    <button
                      onClick={() => handleRoomRequest(req.id, true)}
                      disabled={roomRequestLoading === req.id}
                      className="adminpanel-btn adminpanel-btn-success"
                    >
                      {roomRequestLoading === req.id ? "....." : t("adminPanel.roomRequests.approve")}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingRoomId(req.id);
                        setRejectRoomReason("");
                      }}
                      disabled={roomRequestLoading === req.id}
                      className="adminpanel-btn adminpanel-btn-danger"
                    >
                      {t("adminPanel.roomRequests.reject")}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ROOMS TAB ── */}
      {activeTab === "rooms" && (
        <div>
          <h3 className="adminpanel-mb-16">{t("adminPanel.rooms.title")}</h3>
          {moderationRooms.length === 0 ? (
            <p className="adminpanel-empty">{t("adminPanel.rooms.noRooms")}</p>
          ) : (
            <>
              {/* search and filter */}
              <div className="adminpanel-filters">
                <input
                  type="text"
                  placeholder={t("adminPanel.rooms.searchPlaceholder")}
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="adminpanel-search-input"
                />
                <select
                  value={roomTypeFilter}
                  onChange={(e) => setRoomTypeFilter(e.target.value)}
                  className="adminpanel-select"
                >
                  <option value="">{t("adminPanel.rooms.allTypes")}</option>
                  {isSuperAdmin && <option value="public">{t("adminPanel.rooms.public")}</option>}
                  <option value="university">{t("adminPanel.rooms.university")}</option>
                  <option value="major">{t("adminPanel.rooms.major")}</option>
                  <option value="subject">{t("adminPanel.rooms.subject")}</option>
                </select>
              </div>
              
              {/* stat cards */}
              <div className="adminpanel-stats-grid">
                {moderationRooms
                  .filter((r) => (isSuperAdmin ? r.type !== "private" : true))
                  .filter((r) =>
                    roomTypeFilter ? r.type === roomTypeFilter : true,
                  )
                  .filter((r) =>
                    roomSearch.trim()
                      ? r.name?.toLowerCase().includes(roomSearch.toLowerCase())
                      : true,
                  )
                  .map((room) => {
                    const activeSuspensions =
                      room.suspendedMembers?.filter(
                        (s) => new Date(s.until) > new Date(),
                      ).length || 0;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className="adminpanel-card adminpanel-room-card"
                      >
                        <div className="adminpanel-room-type-badge">
                          <span className={`adminpanel-badge ${
                            room.type === "public"
                              ? "adminpanel-badge-success"
                              : room.type === "subject"
                                ? "adminpanel-badge-warning"
                                : room.type === "university"
                                  ? "adminpanel-badge-primary"
                                  : "adminpanel-badge-dark"
                          }`}>
                            {room.type}
                          </span>
                        </div>
                        <strong className="adminpanel-room-name">
                          {room.name}
                        </strong>
                        <small className="adminpanel-room-stats">
                          {` ${room.members?.length || 0} ${t("adminPanel.rooms.members")}`}
                        </small>
                        {activeSuspensions > 0 && (
                          <small className="adminpanel-room-suspended-count">
                            {` ${activeSuspensions} ${t("adminPanel.rooms.suspended")}`}
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
            <div
              className="adminpanel-modal-overlay"
              onClick={() => setSelectedRoom(null)}
            >
              <div
                className="adminpanel-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="adminpanel-modal-header">
                  <div>
                    <h3 className="adminpanel-modal-title-sm">{selectedRoom.name}</h3>
                    <small className="adminpanel-item-details">
                      {selectedRoom.type} • {selectedRoom.members?.length || 0}
                      {t("adminPanel.rooms.members")}
                    </small>
                  </div>
                  <div className="adminpanel-modal-actions">
                    {isSuperAdmin && selectedRoom.type !== "public" && (
                      <button
                        onClick={() => handleDeleteRoom(selectedRoom.id)}
                        className="adminpanel-btn adminpanel-btn-dark-red"
                      >
                        {t("adminPanel.rooms.deleteRoom")}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className="adminpanel-modal-close"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="adminpanel-modal-content">
                  {selectedRoom.members?.length === 0 ? (
                    <p className="adminpanel-empty">{t("adminPanel.rooms.noMembers")}</p>
                  ) : (
                    selectedRoom.members?.map((memberId) => {
                      const memberUser = users.find((u) => u.id === memberId);
                      const suspension = selectedRoom.suspendedMembers?.find(
                        (s) =>
                          s.userId === memberId &&
                          new Date(s.until) > new Date(),
                      );
                      const isSuspendedInRoom = !!suspension;
                      const isSuspending = roomSuspendingId === memberId;

                      return (
                        <div
                          key={memberId}
                          className="adminpanel-card adminpanel-member-item"
                        >
                          <div className="adminpanel-member-row">
                            <div className="adminpanel-member-info">
                              <div className="adminpanel-member-header">
                                <strong className="adminpanel-member-name">
                                  {memberUser
                                    ? `@${memberUser.username}`
                                    : memberId}
                                </strong>
                                {memberUser && (
                                  <span className="adminpanel-badge adminpanel-badge-primary">
                                    {memberUser.role}
                                  </span>
                                )}
                                {isSuspendedInRoom && (
                                  <span className="adminpanel-badge adminpanel-badge-danger">
                                    {t("adminPanel.rooms.suspendedInRoom")}
                                  </span>
                                )}
                              </div>
                              {isSuspendedInRoom && (
                                <small className="adminpanel-suspension-info">
                                  {`${t("adminPanel.rooms.until")} `}
                                  {new Date(suspension.until).toLocaleDateString()}
                                  — {suspension.reason}
                                </small>
                              )}
                              {memberUser?.roomViolations?.[selectedRoom.id] > 0 && (
                                <small className="adminpanel-violations-info">
                                  {`${t("adminPanel.rooms.roomViolations")}: `}
                                  {memberUser.roomViolations[selectedRoom.id]}
                                </small>
                              )}
                            </div>

                            <div className="adminpanel-button-group">
                              {!isSuspendedInRoom ? (
                                <button
                                  onClick={() => setRoomSuspendingId(memberId)}
                                  className="adminpanel-btn adminpanel-btn-danger"
                                >
                                  {t("adminPanel.rooms.suspend")}
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleRoomUnsuspend(selectedRoom.id, memberId)
                                  }
                                  disabled={actionLoading}
                                  className="adminpanel-btn adminpanel-btn-success"
                                >
                                  {actionLoading ? "..." : t("adminPanel.rooms.unsuspend")}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* suspend form */}
                          {isSuspending && (
                            <div className="adminpanel-suspend-form">
                              <div className="adminpanel-suspend-inputs">
                                <input
                                  type="number"
                                  placeholder={t("adminPanel.rooms.daysPlaceholder")}
                                  value={roomSuspendDays}
                                  onChange={(e) => setRoomSuspendDays(e.target.value)}
                                  className="adminpanel-input-small"
                                />
                                <input
                                  type="text"
                                  placeholder={t("adminPanel.rooms.reasonPlaceholder")}
                                  value={roomSuspendReason}
                                  onChange={(e) => setRoomSuspendReason(e.target.value)}
                                  className="adminpanel-search-input"
                                />
                              </div>
                              <div className="adminpanel-button-group">
                                <button
                                  onClick={() => handleRoomSuspend(selectedRoom.id, memberId)}
                                  disabled={actionLoading}
                                  className="adminpanel-btn adminpanel-btn-danger"
                                >
                                  {actionLoading ? "..." : t("adminPanel.rooms.confirm")}
                                </button>
                                <button
                                  onClick={() => {
                                    setRoomSuspendingId(null);
                                    setRoomSuspendDays("");
                                    setRoomSuspendReason("");
                                  }}
                                  className="adminpanel-btn adminpanel-btn-gray"
                                >
                                  {t("adminPanel.rooms.cancel")}
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

      {/* Drill Down Modal */}
      {drillDown && (
        <div className="adminpanel-modal-overlay" onClick={() => setDrillDown(null)}>
          <div
            className="adminpanel-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="adminpanel-modal-header">
              <h3 className="adminpanel-modal-title">{drillDown.title}</h3>
              <button
                onClick={() => setDrillDown(null)}
                className="adminpanel-modal-close"
              >
                ✕
              </button>
            </div>

            <div className="adminpanel-modal-content">
              {/* USERS */}
              {drillDown.type === "users" &&
                drillDown.data.map((u) => {
                  const isSuspended =
                    u.suspended_until &&
                    new Date(u.suspended_until) > new Date();
                  return (
                    <div
                      key={u.id}
                      className="adminpanel-card adminpanel-drill-item"
                    >
                      <img
                        src={u.profile_pic_url || Cat}
                        alt="pfp"
                        className="adminpanel-profile-img-sm"
                      />
                      <div className="adminpanel-item-flex">
                        <div className="adminpanel-drill-header">
                          <strong>@{u.username}</strong>
                          <span className="adminpanel-badge adminpanel-badge-primary">{u.role}</span>
                          {isSuspended && (
                            <span className="adminpanel-badge adminpanel-badge-danger">suspended</span>
                          )}
                          {u.verificationStatus === "pending" && (
                            <span className="adminpanel-badge adminpanel-badge-pending">pending</span>
                          )}
                        </div>
                        <small className="adminpanel-item-details">
                          {u.email} • {t("adminPanel.users.rating")}: {u.rating ?? 1}/5 
                          • {t("adminPanel.users.violations")}: {u.violation_count || 0}
                        </small>
                        {isSuspended && (
                          <small className="adminpanel-suspension-text">
                            Until {new Date(u.suspended_until).toLocaleDateString()} — {u.suspension_reason}
                          </small>
                        )}
                      </div>
                      {/* action history button */}
                      {u.actionHistory?.length > 0 && (
                        <button
                          onClick={() =>
                            setDrillDown({
                              type: "history",
                              title: `@${u.username} History`,
                              data: u.actionHistory,
                            })
                          }
                          className="adminpanel-btn adminpanel-btn-primary"
                        >
                          📋 History
                        </button>
                      )}
                    </div>
                  );
                })}

              {/* POSTS */}
              {drillDown.type === "posts" &&
                drillDown.data.map((post) => (
                  <div key={post.id} className="adminpanel-card">
                    <div className="adminpanel-drill-header">
                      <strong>@{post.authorUsername}</strong>
                      <span className="adminpanel-badge adminpanel-badge-primary">{post.authorRole}</span>
                      {post.isHidden && (
                        <span className="adminpanel-badge adminpanel-badge-danger">hidden</span>
                      )}
                      {post.reports?.length > 0 && (
                        <span className="adminpanel-badge adminpanel-badge-pending">
                          🚩 {post.reports.length}
                        </span>
                      )}
                      <small className="adminpanel-item-details" style={{ marginLeft: "auto" }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    {post.title && (
                      <strong style={{ display: "block", marginBottom: "4px" }}>
                        {post.title}
                      </strong>
                    )}
                    <p className="adminpanel-drill-content">
                      {post.content?.slice(0, 120)}...
                    </p>
                    <small className="adminpanel-drill-footer">
                      {`💬 ${post.comments?.length || 0} ${t("adminPanel.drillDown.comments")}
                       •👍 ${post.votes?.useful || 0} • 
                       👎 ${post.votes?.useless || 0}`}
                    </small>
                  </div>
                ))}

              {/* COMMENTS */}
              {drillDown.type === "comments" &&
                drillDown.data.map((comment) => (
                  <div key={comment.id} className="adminpanel-card">
                    <div className="adminpanel-drill-header">
                      <strong>@{comment.authorUsername}</strong>
                      {comment.isHidden && (
                        <span className="adminpanel-badge adminpanel-badge-danger">{t("adminPanel.drillDown.hiddenBadge")}</span>
                      )}
                      {comment.reports?.length > 0 && (
                        <span className="adminpanel-badge adminpanel-badge-pending">
                          🚩 {comment.reports.length}
                        </span>
                      )}
                      <small className="adminpanel-item-details" style={{ marginLeft: "auto" }}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <p className="adminpanel-drill-content">
                      {comment.content?.slice(0, 120)}
                    </p>
                    <small className="adminpanel-drill-footer">
                      In post: {comment.postTitle}
                    </small>
                  </div>
                ))}

              {/* ROOMS */}
              {drillDown.type === "rooms" &&
                drillDown.data.map((room) => (
                  <div
                    key={room.id}
                    className="adminpanel-card adminpanel-flex-between"
                  >
                    <div>
                      <strong>{room.name}</strong>
                      <small className="adminpanel-item-details" style={{ display: "block", marginTop: "4px" }}>
                        {`${t("adminPanel.drillDown.type")}: ${room.type}`} • {`${t("adminPanel.drillDown.membersCount")}: ${room.members?.length || 0}`}
                        {room.university && `• ${t("adminPanel.drillDown.uni")}: ${room.university}`}
                        {room.major && `• ${t("adminPanel.drillDown.majorLabel")}: ${room.major}`}
                      </small>
                    </div>
                    <span className={`adminpanel-badge ${
                      room.type === "public"
                        ? "adminpanel-badge-success"
                        : room.type === "private"
                          ? "adminpanel-badge-danger"
                          : room.type === "subject"
                            ? "adminpanel-badge-warning"
                            : "adminpanel-badge-primary"
                    }`}>
                      {room.type}
                    </span>
                  </div>
                ))}

              {/* ACTION HISTORY */}
              {drillDown.type === "history" &&
                drillDown.data.map((entry, i) => (
                  <div
                    key={i}
                    className="adminpanel-card adminpanel-history-item"
                  >
                    <div className="adminpanel-history-dot" />
                    <div>
                      <strong className="adminpanel-history-action">
                        {entry.action}
                      </strong>
                      {entry.by && (
                        <small className="adminpanel-history-by">
                          {`${t("adminPanel.drillDown.historyBy")} @${entry.by}`}
                        </small>
                      )}
                      {entry.reason && (
                        <small className="adminpanel-history-reason">
                          {`${t("adminPanel.drillDown.reason")}: ${entry.reason}`}
                        </small>
                      )}
                      <small className="adminpanel-history-date">
                        {new Date(entry.date).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))}

              {drillDown.data?.length === 0 && (
                <p className="adminpanel-empty">
                  {t("adminPanel.drillDown.nothing")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}