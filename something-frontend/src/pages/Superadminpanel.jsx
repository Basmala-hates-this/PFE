import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.js";

const API = "http://localhost:5000/api/admin";

const PERMISSIONS = [
  { key: "SUSPEND_USERS", label: "Suspend Users" },
  { key: "VERIFY_PROFESSORS", label: "Verify Professors" },
  { key: "HANDLE_REPORTS", label: "Handle Reports" },
  { key: "MODERATE_CONTENT", label: "Moderate Content" },
  { key: "MANAGE_ROOMS", label: "Manage Rooms" },
  { key: "VALIDATE_OTHER", label: "Validate Other Inputs" },
  { key: "APPROVE_RESOURCES", label: "Approve Resources" },
  { key: "DELETE_INACTIVE", label: "Delete Inactive Accounts" },
];

export default function SuperAdminPanel() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

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

  const [selectedRooms, setSelectedRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);

  const [currentAdmins, setCurrentAdmins] = useState([]);
  const [editingAdminId, setEditingAdminId] = useState(null);

  const [drillDown, setDrillDown] = useState(null);

  //override this shit
  const [overridingLogId, setOverridingLogId] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  //////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (currentUser?.authorityLevel !== "superadmin") {
      navigate("/dashboard");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "stats") fetchStats();
    if (activeTab === "logs") fetchLogs();
    if (activeTab === "admins") {
      fetchApplications();
      fetchCurrentAdmins();
      fetchAllRooms();
    }
  }, [activeTab]);
  // loading the shit

  ///////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/stats`, { headers });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/logs`, { headers });
      setLogs([...res.data].reverse());
      console.log("log sample:", res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const params = adminSearch ? `?q=${adminSearch}` : "";
      const res = await axios.get(`${API}/users${params}`, { headers });
      setAllUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpgradeAdmin = async (userId) => {
    console.log("upgrading userId:", userId);
    setActionLoading(true);
    try {
      await axios.patch(
        `${API}/users/${userId}/upgrade-admin`,
        { permissions: selectedPermissions },
        { headers },
      );
      alert("User upgraded to admin!");
      setUpgradingId(null);
      setSelectedPermissions([]);
      fetchAllUsers();
      setSelectedRooms([]);
      fetchApplications();
      fetchAllRooms();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!window.confirm("Remove admin status from this user?")) return;
    try {
      await axios.patch(`${API}/users/${userId}/remove-admin`, {}, { headers });
      alert("Admin removed.");
      fetchAllUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
  };

  const handleUpgradeToSuperAdmin = async (userId) => {
    if (
      !window.confirm(
        "Upgrade this user to SuperAdmin? This cannot be undone easily.",
      )
    )
      return;
    try {
      await axios.patch(
        `${API}/users/${userId}/upgrade-superadmin`,
        {},
        { headers },
      );
      alert("User upgraded to SuperAdmin!");
      fetchAllUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
  };

  const handleDeleteAccount = async (userId, username) => {
    if (
      !window.confirm(
        `Permanently delete @${username}'s account? This cannot be undone.`,
      )
    )
      return;
    const confirm2 = prompt(`Type "@${username}" to confirm deletion:`);
    if (confirm2 !== `@${username}`) return alert("Confirmation failed.");
    try {
      await axios.delete(`${API}/users/${userId}`, { headers });
      alert("Account deleted.");
      fetchAllUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
  };

  const togglePermission = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const card = {
    background: "#252b45",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px",
  };
  const badge = (color) => ({
    background: color,
    color: "white",
    padding: "2px 8px",
    borderRadius: "10px",
    fontSize: "11px",
  });
  const btn = (color = "#6476af") => ({
    padding: "6px 14px",
    borderRadius: "6px",
    background: color,
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
  });

  const logActionColor = (action) => {
    if (
      action.includes("delete") ||
      action.includes("reject") ||
      action.includes("suspend")
    )
      return "#e74c3c";
    if (
      action.includes("verify") ||
      action.includes("unsuspend") ||
      action.includes("approve")
    )
      return "#27ae60";
    if (action.includes("upgrade") || action.includes("admin"))
      return "#f39c12";
    return "#6476af";
  };

  const tabs = [
    { id: "stats", label: t("superadmin.tabs.stats") },
    { id: "admins", label: t("superadmin.tabs.admins") },
    { id: "logs", label: t("superadmin.tabs.logs") },
  ];

  //aplicats
  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${API}/applications`, { headers });
      setApplications(res.data);
      console.log("application sample:", res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectApplication = async (userId) => {
    if (!rejectAppReason.trim())
      return alert("Please enter a rejection reason.");
    setActionLoading(true);
    try {
      await axios.post(
        `${API}/applications/reject`,
        { userId, reason: rejectAppReason },
        { headers },
      );
      alert("Application rejected.");
      setRejectingAppId(null);
      setRejectAppReason("");
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAllRooms = async () => {
    try {
      const res = await axios.get(`${API}/rooms-moderation`, { headers });
      setAllRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurrentAdmins = async (search = "") => {
    try {
      const params = search ? `?q=${search}` : "";
      const res = await axios.get(`${API}/admins${params}`, { headers });
      setCurrentAdmins(res.data);
      console.log("admin sample:", res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAdminPermissions = async (adminId) => {
    setActionLoading(true);
    try {
      await axios.patch(
        `${API}/users/${adminId}/edit-permissions`,
        { permissions: selectedPermissions, assignedRooms: selectedRooms },
        { headers },
      );
      alert("Permissions updated!");
      setEditingAdminId(null);
      setSelectedPermissions([]);
      setSelectedRooms([]);
      fetchCurrentAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchDrillDown = async (type) => {
    setDrillDown({ type, title: t("superadmin.stats.loading"), data: null });
    try {
      switch (type) {
        case "users": {
          const res = await axios.get(`${API}/users`, { headers });
          setDrillDown({ type: "users", title: t("superadmin.drill.titleUsers"), data: res.data });

          break;
        }
        case "suspended": {
          const res = await axios.get(`${API}/users?status=suspended`, {
            headers,
          });
          setDrillDown({
            type: "users",
            title: t("superadmin.drill.titleSuspendedUsers"),
            data: res.data,
          });
          break;
        }
        case "posts": {
          const res = await axios.get(`${API}/posts`, { headers });

          setDrillDown({ type: "posts", title: t("superadmin.drill.titlePosts"), data: res.data });
          console.log("post sample for drilldown:", res.data[0]);
          break;
        }
        case "comments": {
          const res = await axios.get(`${API}/comments`, { headers });
          console.log("comment sample:", res.data[0]);
          setDrillDown({
            type: "comments",
            title: t("superadmin.drill.titleComments"),
            data: res.data,
          });
          break;
        }
        case "rooms": {
          const res = await axios.get(`${API}/rooms`, { headers });
          setDrillDown({ type: "rooms", title: t("superadmin.drill.titleRooms"), data: res.data });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverride = async (logId) => {
    if (!overrideReason.trim())
      return alert("Please enter a reason for the override.");
    setActionLoading(true);
    try {
      await axios.post(
        `${API}/logs/${logId}/override`,
        { reason: overrideReason },
        { headers },
      );
      alert("Action overridden successfully.");
      setOverridingLogId(null);
      setOverrideReason("");
      fetchLogs(); // refresh so the overridden badge shows immediately
    } catch (err) {
      alert(err.response?.data?.message || "Override failed.");
    } finally {
      setActionLoading(false);
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////
  //to be or not to be...emojies in all pages or no emojis at all.....

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1f35",
        color: "white",
        padding: "20px",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => navigate("/admin")}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ←
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{t("superadmin.title")}</h2>
          <small style={{ opacity: 0.5 }}>
            @{currentUser?.username} — {t("superadmin.subtitle")}
          </small>
        </div>
      </div>

      {/* tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "24px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "12px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              background:
                activeTab === tab.id ? "#6476af" : "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: activeTab === tab.id ? "600" : "400",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {activeTab === "stats" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>{t("superadmin.stats.title")}</h3>
          {!stats ? (
            <p style={{ opacity: 0.5 }}>{t("superadmin.stats.loading")}</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
              }}
            >
              {[
                {
                  label: t("superadmin.stats.totalUsers"),
                  value: stats.totalUsers,
                  icon: "👥",
                  action: () => fetchDrillDown("users"),
                },
                {
                  label: t("superadmin.stats.totalPosts"),
                  value: stats.totalPosts,
                  icon: "📝",
                  action: () => fetchDrillDown("posts"),
                },
                {
                  label: t("superadmin.stats.totalComments"),
                  value: stats.totalComments,
                  icon: "🗨️",
                  action: () => fetchDrillDown("comments"),
                },
                {
                  label: t("superadmin.stats.totalRooms"),
                  value: stats.totalRooms,
                  icon: "🏠",
                  action: () => fetchDrillDown("rooms"),
                },
                {
                  label: t("superadmin.stats.suspendedUsers"),
                  value: stats.suspendedUsers,
                  icon: "🚫",
                  action: () => fetchDrillDown("suspended"),
                },
                {
                  label: t("superadmin.stats.pendingProfessors"),
                  value: stats.pendingProfessors,
                  icon: "🎓",
                  action: () => navigate("/admin"),
                },
                {
                  label: t("superadmin.stats.reportedContent"),
                  value: stats.reportedContent,
                  icon: "🚩",
                  action: () => navigate("/admin"),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  onClick={s.action}
                  style={{
                    ...card,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "6px" }}>
                    {s.icon}
                  </div>
                  <strong style={{ fontSize: "24px", display: "block" }}>
                    {s.value}
                  </strong>
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
          {/* ── APPLICATIONS ── */}
          <h3 style={{ marginBottom: "16px" }}>{t("superadmin.admins.applicationsTitle")}</h3>
          {applications.length === 0 ? (
            <p style={{ opacity: 0.5, marginBottom: "32px" }}>
              {t("superadmin.admins.noApplications")}
            </p>
          ) : (
            applications.map((app) => {
              const isRejecting = rejectingAppId === app.user_id;
              const isUpgrading = upgradingId === app.user_id;
              return (
                <div key={app.user_id} style={card}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: isUpgrading || isRejecting ? "12px" : "0",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <strong>@{app.username}</strong>
                        <span style={badge("#6476af")}>{t("superadmin.admins.applicant")}</span>
                        <span style={badge("#f39c12")}> {app.rating}/5</span>
                      </div>
                      <small style={{ opacity: 0.5 }}>
                        {app.email} • {t("superadmin.admins.applied")}{" "}
                        {new Date(app.appliedAt).toLocaleString()}
                      </small>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => {
                          setUpgradingId(app.user_id);
                          setSelectedPermissions([]);
                          setSelectedRooms([]);
                          setEditingAdminId(null);
                        }}
                        style={btn("#f39c12")}
                      >
                        {t("superadmin.admins.accept")}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingAppId(app.user_id);
                          setRejectAppReason("");
                        }}
                        style={btn("#c0392b")}
                      >
                        {t("superadmin.admins.reject")}
                      </button>
                    </div>
                  </div>

                  {isUpgrading && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        padding: "12px",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 10px",
                          fontSize: "13px",
                          opacity: 0.7,
                        }}
                      >
                        {t("superadmin.admins.selectPerms")}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginBottom: "12px",
                        }}
                      >
                        {PERMISSIONS.map((p) => (
                          <label
                            key={p.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(p.key)}
                              onChange={() => togglePermission(p.key)}
                            />
                            {t(`perm.${p.key}`)}
                          </label>
                        ))}
                      </div>
                      {selectedPermissions.includes("MANAGE_ROOMS") && (
                        <div style={{ marginBottom: "12px" }}>
                          <p
                            style={{
                              margin: "0 0 8px",
                              fontSize: "13px",
                              opacity: 0.7,
                            }}
                          >
                            {t("superadmin.admins.assignRooms")}
                          </p>
                          {allRooms.filter(
                            (r) => r.type !== "private" && r.type !== "public",
                          ).length === 0 ? (
                            <small style={{ opacity: 0.5 }}>
                              {t("superadmin.admins.noRooms")}
                            </small>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                                maxHeight: "150px",
                                overflowY: "auto",
                              }}
                            >
                              {allRooms
                                .filter(
                                  (r) =>
                                    r.type !== "private" && r.type !== "public",
                                )
                                .map((room) => (
                                  <label
                                    key={room.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      cursor: "pointer",
                                      fontSize: "13px",
                                      background: "rgba(255,255,255,0.05)",
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedRooms.includes(room.id)}
                                      onChange={() =>
                                        setSelectedRooms((prev) =>
                                          prev.includes(room.id)
                                            ? prev.filter(
                                                (id) => id !== room.id,
                                              )
                                            : [...prev, room.id],
                                        )
                                      }
                                    />
                                    <span>{room.name}</span>
                                    <small
                                      style={{ opacity: 0.5, fontSize: "11px" }}
                                    >
                                      {room.type}
                                    </small>
                                  </label>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleUpgradeAdmin(app.user_id)}
                          disabled={actionLoading}
                          style={btn("#27ae60")}
                        >
                          {actionLoading ? t("superadmin.admins.upgrading") : t("superadmin.admins.confirm")}
                        </button>
                        <button
                          onClick={() => {
                            setUpgradingId(null);
                            setSelectedPermissions([]);
                            setSelectedRooms([]);
                          }}
                          style={btn("rgba(255,255,255,0.1)")}
                        >
                          {t("superadmin.admins.cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  {isRejecting && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        padding: "12px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder={t("superadmin.admins.rejectPlaceholder")}
                        value={rejectAppReason}
                        onChange={(e) => setRejectAppReason(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          background: "rgba(255,255,255,0.1)",
                          color: "white",
                          boxSizing: "border-box",
                          marginBottom: "8px",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleRejectApplication(app.user_id)}
                          style={btn("#c0392b")}
                        >
                          {actionLoading ? t("superadmin.admins.rejecting") : t("superadmin.admins.confirmReject")}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingAppId(null);
                            setRejectAppReason("");
                          }}
                          style={btn("rgba(255,255,255,0.1)")}
                        >
                          {t("superadmin.admins.cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* ── CURRENT ADMINS ── */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "24px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0 }}>{t("superadmin.admins.currentTitle")}</h3>
              <input
                type="text"
                placeholder={t("superadmin.admins.searchPlaceholder")}
                value={adminSearch}
                onChange={(e) => {
                  setAdminSearch(e.target.value);
                  fetchCurrentAdmins(e.target.value);
                }}
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  width: "220px",
                }}
              />
            </div>

            {currentAdmins.length === 0 ? (
              <p style={{ opacity: 0.5 }}>{t("superadmin.admins.noAdmins")}</p>
            ) : (
              currentAdmins.map((admin) => {
                const isEditing = editingAdminId === admin.id;
                return (
                  <div key={admin.id} style={card}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <img
                        src={admin.profile_pic_url || Cat}
                        alt="pfp"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <strong>@{admin.username}</strong>
                          <span style={badge("#4a3f6b")}>{t("superadmin.admins.adminBadge")}</span>
                          <span style={badge("#f39c12")}>
                            ⭐ {admin.rating ?? 1}/5
                          </span>
                        </div>
                        <small style={{ opacity: 0.5, display: "block" }}>
                          {admin.email}
                        </small>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                            marginTop: "6px",
                          }}
                        >
                          {admin.permissions?.length > 0 ? (
                            (Array.isArray(admin.permissions)
                              ? admin.permissions
                              : []
                            ).map((p) => (
                              <span
                                key={p}
                                style={{
                                  ...badge("#2d3b6b"),
                                  fontSize: "10px",
                                }}
                              >
                                {p}
                              </span>
                            ))
                          ) : (
                            <small style={{ opacity: 0.4 }}>
                              {t("superadmin.admins.noPermissions")}
                            </small>
                          )}
                        </div>
                        {Array.isArray(admin.assignedRooms) &&
                          admin.assignedRooms.length > 0 && (
                            <small
                              style={{
                                opacity: 0.4,
                                display: "block",
                                marginTop: "4px",
                              }}
                            >
                              {t("superadmin.admins.rooms")}{" "}
                              {admin.assignedRooms
                                .map(
                                  (rid) =>
                                    allRooms.find((r) => r.id === rid)?.name ||
                                    rid,
                                )
                                .join(", ")}
                            </small>
                          )}
                      </div>
                      <div
                        style={{ display: "flex", gap: "6px", flexShrink: 0 }}
                      >
                        <button
                          onClick={() => {
                            setEditingAdminId(isEditing ? null : admin.id);
                            setSelectedPermissions(
                              isEditing
                                ? []
                                : [
                                    ...(Array.isArray(admin.permissions)
                                      ? admin.permissions
                                      : []),
                                  ],
                            );

                            setSelectedRooms(
                              isEditing
                                ? []
                                : [
                                    ...(Array.isArray(admin.assignedRooms)
                                      ? admin.assignedRooms
                                      : []),
                                  ],
                            );

                            setUpgradingId(null);
                          }}
                          style={btn(
                            isEditing ? "rgba(255,255,255,0.1)" : "#6476af",
                          )}
                        >
                          {isEditing ? t("superadmin.admins.cancel") : t("superadmin.admins.edit")}
                        </button>
                        <button
                          onClick={() => handleRemoveAdmin(admin.id)}
                          style={btn("#c0392b")}
                        >
                          {t("superadmin.admins.remove")}
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div
                        style={{
                          marginTop: "12px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 10px",
                            fontSize: "13px",
                            opacity: 0.7,
                          }}
                        >
                          {t("superadmin.admins.editPerms")}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginBottom: "12px",
                          }}
                        >
                          {PERMISSIONS.map((p) => (
                            <label
                              key={p.key}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(p.key)}
                                onChange={() => togglePermission(p.key)}
                              />
                              {t(`perm.${p.key}`)}
                            </label>
                          ))}
                        </div>
                        {selectedPermissions.includes("MANAGE_ROOMS") && (
                          <div style={{ marginBottom: "12px" }}>
                            <p
                              style={{
                                margin: "0 0 8px",
                                fontSize: "13px",
                                opacity: 0.7,
                              }}
                            >
                              {t("superadmin.admins.assignedRooms")}
                            </p>
                            {allRooms.filter(
                              (r) =>
                                r.type !== "private" && r.type !== "public",
                            ).length === 0 ? (
                              <small style={{ opacity: 0.5 }}>
                                {t("superadmin.admins.noRooms")}
                              </small>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "8px",
                                  maxHeight: "150px",
                                  overflowY: "auto",
                                }}
                              >
                                {allRooms
                                  .filter(
                                    (r) =>
                                      r.type !== "private" &&
                                      r.type !== "public",
                                  )
                                  .map((room) => (
                                    <label
                                      key={room.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        background: "rgba(255,255,255,0.05)",
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedRooms.includes(
                                          room.id,
                                        )}
                                        onChange={() =>
                                          setSelectedRooms((prev) =>
                                            prev.includes(room.id)
                                              ? prev.filter(
                                                  (id) => id !== room.id,
                                                )
                                              : [...prev, room.id],
                                          )
                                        }
                                      />
                                      <span>{room.name}</span>
                                      <small
                                        style={{
                                          opacity: 0.5,
                                          fontSize: "11px",
                                        }}
                                      >
                                        {room.type}
                                      </small>
                                    </label>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => handleEditAdminPermissions(admin.id)}
                          disabled={actionLoading}
                          style={btn("#27ae60")}
                        >
                          {actionLoading ? t("superadmin.admins.saving") : t("superadmin.admins.saveChanges")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {activeTab === "logs" && (
        <div>
          <h3 style={{ marginBottom: "16px" }}>{t("superadmin.logs.title")}</h3>
          {logs.length === 0 ? (
            <p style={{ opacity: 0.5 }}>{t("superadmin.logs.empty")}</p>
          ) : (
            logs.map((log) => {
              const isOverridable = [
                "suspend_user",
                "hide_post",
                "hide_comment",
                "room_suspend",
                "approve_resource",
                "reject_resource",
              ].includes(log.action);
              const isOverriding = overridingLogId === log.id;

              return (
                <div
                  key={log.id}
                  style={{ ...card, opacity: log.overridden_by ? 0.5 : 1 }}
                >
                  {/* main log row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: log.overridden_by
                          ? "#555"
                          : logActionColor(log.action),
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <strong style={{ fontSize: "13px" }}>
                          @{log.admin_username}
                        </strong>
                        <span
                          style={{
                            ...badge(
                              log.overridden_by
                                ? "#555"
                                : logActionColor(log.action),
                            ),
                            fontSize: "10px",
                          }}
                        >
                          {log.action}
                        </span>
                        {log.overridden_by && (
                          <span
                            style={{ ...badge("#7f8c8d"), fontSize: "10px" }}
                          >
                            {t("superadmin.logs.overriddenBy")} @{log.overridden_by}
                          </span>
                        )}
                      </div>
                      <small style={{ opacity: 0.6 }}>{log.details}</small>
                      {log.overridden_by && (
                        <small
                          style={{
                            display: "block",
                            opacity: 0.4,
                            marginTop: "2px",
                          }}
                        >
                          {t("superadmin.logs.overrideReason")} {log.override_reason} •{" "}
                          {new Date(log.overridden_at).toLocaleString()}
                        </small>
                      )}
                    </div>
                    <small
                      style={{ opacity: 0.4, fontSize: "11px", flexShrink: 0 }}
                    >
                      {new Date(log.created_at).toLocaleString()}
                    </small>
                    {/* override button — only for overridable actions that haven't been overridden yet */}
                    {isOverridable && !log.overridden_by && (
                      <button
                        onClick={() => {
                          setOverridingLogId(isOverriding ? null : log.id);
                          setOverrideReason("");
                        }}
                        style={btn(
                          isOverriding ? "rgba(255,255,255,0.1)" : "#c0392b",
                        )}
                      >
                        {isOverriding ? t("superadmin.admins.cancel") : t("superadmin.logs.override")}
                      </button>
                    )}
                  </div>

                  {/* inline override form */}
                  {isOverriding && (
                    <div
                      style={{
                        marginTop: "10px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        padding: "12px",
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder={t("superadmin.logs.overridePlaceholder")}
                        style={{
                          flex: 1,
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          color: "white",
                          fontSize: "13px",
                        }}
                      />
                      <button
                        onClick={() => handleOverride(log.id)}
                        style={btn("#e74c3c")}
                        disabled={actionLoading}
                      >
                        {actionLoading ? t("superadmin.logs.overriding") : t("superadmin.logs.confirmOverride")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      {/* this could go so wrong in so many places... */}
      {drillDown && (
        <div className="modal-overlay" onClick={() => setDrillDown(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "650px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0 }}>{drillDown.title}</h3>
              <button
                onClick={() => setDrillDown(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {/* USERS */}
              {drillDown.type === "users" &&
                Array.isArray(drillDown.data) &&
                drillDown.data.map((u) => {
                  const isSuspended =
                    u.suspended_until &&
                    new Date(u.suspended_until) > new Date();
                  return (
                    <div
                      key={u.id}
                      style={{
                        ...card,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <img
                        src={u.profile_pic_url || Cat}
                        alt="pfp"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <strong>@{u.username}</strong>
                          <span style={badge("#6476af")}>{u.role}</span>
                          {isSuspended && (
                            <span style={badge("#c0392b")}>{t("superadmin.drill.suspended")}</span>
                          )}
                          {u.verification_status === "pending" && (
                            <span style={badge("#e67e22")}>{t("superadmin.drill.pending")}</span>
                          )}
                        </div>
                        <small style={{ opacity: 0.5 }}>
                          {u.email} • {t("superadmin.drill.rating")} {u.rating ?? 1}/5 • {t("superadmin.drill.violations")}{" "}
                          {u.violation_count || 0}
                        </small>
                        {isSuspended && (
                          <small
                            style={{
                              display: "block",
                              color: "#e74c3c",
                              marginTop: "2px",
                            }}
                          >
                            {t("superadmin.drill.until")}{" "}
                            {new Date(u.suspended_until).toLocaleDateString()} —{" "}
                            {u.suspension_reason}
                          </small>
                        )}
                      </div>
                      {/* action history button */}
                      {u.action_history?.length > 0 && (
                        <button
                          onClick={() =>
                            setDrillDown({
                              type: "history",
                              title: `@${u.username} ${t("superadmin.drill.titleHistory")}`,
                              data: u.action_history,
                            })
                          }
                          style={btn()}
                        >
                          {t("superadmin.drill.history")}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAccount(u.id, u.username)}
                        style={btn("#7f0000")}
                      >
                        {t("superadmin.drill.delete")}
                      </button>
                    </div>
                  );
                })}

              {/* POSTS */}
              {drillDown.type === "posts" &&
                Array.isArray(drillDown.data) &&
                drillDown.data.map((post) => (
                  <div key={post.id} style={card}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <strong>@{post.author_username}</strong>
                      <span style={badge("#6476af")}>{post.author_role}</span>
                      {post.isHidden && (
                        <span style={badge("#c0392b")}>{t("superadmin.drill.hidden")}</span>
                      )}
                      {post.reports?.length > 0 && (
                        <span style={badge("#e67e22")}>
                          🚩 {post.reports.length}
                        </span>
                      )}
                      <small style={{ marginLeft: "auto", opacity: 0.5 }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    {post.title && (
                      <strong style={{ display: "block", marginBottom: "4px" }}>
                        {post.title}
                      </strong>
                    )}
                    <p style={{ margin: 0, opacity: 0.7, fontSize: "13px" }}>
                      {post.content?.slice(0, 120)}...
                    </p>
                    <small style={{ opacity: 0.4 }}>
                      💬 {post.comments?.length || 0} {t("superadmin.drill.comments")} • 👍{" "}
                      {post.votes?.useful || 0} • 👎 {post.votes?.useless || 0}
                    </small>
                  </div>
                ))}

              {/* COMMENTS */}
              {drillDown.type === "comments" &&
                Array.isArray(drillDown.data) &&
                drillDown.data.map((comment) => (
                  <div key={comment.id} style={card}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <strong>@{comment.authorUsername}</strong>
                      {comment.isHidden && (
                        <span style={badge("#c0392b")}>{t("superadmin.drill.hidden")}</span>
                      )}
                      {comment.reports?.length > 0 && (
                        <span style={badge("#e67e22")}>
                          🚩 {comment.reports.length}
                        </span>
                      )}
                      <small style={{ marginLeft: "auto", opacity: 0.5 }}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <p
                      style={{
                        margin: "0 0 4px",
                        opacity: 0.7,
                        fontSize: "13px",
                      }}
                    >
                      {comment.content?.slice(0, 120)}
                    </p>
                    <small style={{ opacity: 0.4 }}>
                      {t("superadmin.drill.inPost")} {comment.postTitle}
                    </small>
                  </div>
                ))}

              {/* ROOMS */}
              {drillDown.type === "rooms" &&
                Array.isArray(drillDown.data) &&
                drillDown.data.map((room) => (
                  <div
                    key={room.id}
                    style={{
                      ...card,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{room.name}</strong>
                      <small
                        style={{
                          display: "block",
                          opacity: 0.5,
                          marginTop: "4px",
                        }}
                      >
                        {t("superadmin.drill.type")} {room.type} • {t("superadmin.drill.members")}{room.members?.length || 0}
                        {room.university && <> • {t("superadmin.drill.uni")} {room.university}</>}
{room.major && <> • {t("superadmin.drill.major")} {room.major}</>}
                      </small>
                    </div>
                    <span
                      style={badge(
                        room.type === "public"
                          ? "#27ae60"
                          : room.type === "private"
                            ? "#c0392b"
                            : room.type === "subject"
                              ? "#f39c12"
                              : "#6476af",
                      )}
                    >
                      {room.type}
                    </span>
                  </div>
                ))}

              {/* ACTION HISTORY */}
              {drillDown.type === "history" &&
                Array.isArray(drillDown.data) &&
                drillDown.data.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      ...card,
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#6476af",
                        marginTop: "6px",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <strong style={{ fontSize: "13px" }}>
                        {entry.action}
                      </strong>
                      {entry.by && (
                        <small style={{ display: "block", opacity: 0.5 }}>
                          {`${t("superadmin.drill.by")} @`} {entry.by}
                        </small>
                      )}
                      {entry.reason && (
                        <small style={{ display: "block", opacity: 0.5 }}>
                         {t("superadmin.drill.reason")} {entry.reason}
                        </small>
                      )}
                      <small style={{ opacity: 0.4 }}>
                        {new Date(entry.date).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))}

              {!drillDown.data ? (
                <p style={{ opacity: 0.5, textAlign: "center" }}>{t("superadmin.stats.loading")}</p>
              ) : drillDown.data.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: "center" }}>
                  {t("superadmin.drill.empty")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
