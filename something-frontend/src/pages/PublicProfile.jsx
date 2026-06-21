
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import ReportModal from "../assets/components/ReportModal.jsx";
import "../styles/pallette.css";
import { useTranslation } from 'react-i18next';
import "../styles/pub.css"; // Import the CSS file
import api from "../api/axios.js";

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [showReportUser, setShowReportUser] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [majors, setMajors] = useState([]);


  const [expanded, setExpanded] = useState(false);
const LIMIT = 251;

  //note to self...maybe change the local storage to a global state?....this might fix the resedue of the logout entirly..

  ////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // const [userRes, statsRes, postsRes, followersRes, majorsRes] = await Promise.all([
        //   axios.get(`http://localhost:5000/api/users/${userId}`, {
        //     headers: { Authorization: `Bearer ${token}` }
        //   }),
        //   axios.get(`http://localhost:5000/api/users/${userId}/stats`, {
        //     headers: { Authorization: `Bearer ${token}` }
        //   }),
        //   axios.get(`http://localhost:5000/api/posts/user/${userId}`, {
        //     headers: { Authorization: `Bearer ${token}` }
        //   }),
        //   axios.get(`http://localhost:5000/api/users/${userId}/followers`, {
        //     headers: { Authorization: `Bearer ${token}` }
        //   }),
        //   axios.get(`http://localhost:5000/api/users/${userId}/majors`, {
        //     headers: { Authorization: `Bearer ${token}` }
        //   }),
        // ]);
        const [userRes, statsRes, postsRes, followersRes, majorsRes] = await Promise.all([
  api.get(`/users/${userId}`),
  api.get(`/users/${userId}/stats`),
  api.get(`/posts/user/${userId}`),
  api.get(`/users/${userId}/followers`),
  api.get(`/users/${userId}/majors`),
]);

        console.log("user:", userRes.data);
        console.log("stats:", statsRes.data);
        console.log("posts sample:", postsRes.data[0]);
        console.log("followers sample:", followersRes.data[0]);

        setUser(userRes.data);
        setStats(statsRes.data);
        setPosts(postsRes.data);
        setMajors(majorsRes.data);

        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const alreadyFollowing = followersRes.data.some(f => f.id === currentUser?.id);
        setIsFollowing(alreadyFollowing);

      } catch (err) {
        console.error("Failed to fetch profile:", err);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  /////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  const handleFollow = async () => {
    console.log("handleFollow called, isFollowing:", isFollowing);

    if (followLoading) return;
    setFollowLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (isFollowing) {
        // await axios.delete(`http://localhost:5000/api/users/${userId}/unfollow`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        await api.delete(`/users/${userId}/unfollow`);
        setIsFollowing(false);
      } else {
        // await axios.post(`http://localhost:5000/api/users/${userId}/follow`, {}, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        await api.post(`/users/${userId}/follow`, {});
        setIsFollowing(true);
      }

      // refetch user to get updated followers//nodemon cuased timing isseu with reading and updating....
      // const userRes = await axios.get(`http://localhost:5000/api/users/${userId}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setUser(userRes.data);

    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      console.error("Failed to follow/unfollow:", err);
      alert(msg);
    } finally {
      setFollowLoading(false);
    }
  };

  /////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////

  return (
    <div className="publicprofile-container">
      
      {/* back button */}
      <button onClick={() => navigate(-1)} className="publicprofile-back-button">←</button>

      {/* profile card */}
      <div className="publicprofile-card">
        <img src={user?.profilePicUrl || Cat} alt="pfp" className="publicprofile-avatar"/>
        <div className="publicprofile-info" dir={isRTL ? "rtl" : "ltr"}>
          <h2 className="publicprofile-username">@{user?.username}</h2>
          <small className="publicprofile-role-badge">{user?.role}</small>
          <p className="publicprofile-major">{`${t("publicProfile.major")}: ${majors.join(", ")}`}</p>
          <p className="publicprofile-rating">{`${t("publicProfile.rating")}: ${user?.rating ?? 1} / 5`}</p>
        </div>
        <button
          dir={isRTL ? "rtl" : "ltr"}
          onClick={handleFollow}
          disabled={followLoading}
          className={`publicprofile-follow-button ${isFollowing ? "publicprofile-follow-button-following" : ""} ${followLoading ? "publicprofile-button-disabled" : ""}`}
        >
          {followLoading ? "..." : isFollowing ? t("publicProfile.following") : t("publicProfile.follow")}
        </button>
        <button
          onClick={() => navigate(`/connections/${userId}`)}
          className="publicprofile-connections-button"
        >
          {t("publicProfile.viewConnections")}
        </button>
        {currentUser?.id !== userId && (
          <button
            onClick={() => setShowReportUser(true)}
            className="publicprofile-report-button"
          >
            {t("publicProfile.report")}
          </button>
        )}
      </div>

      {/* stats */}
      <div className="publicprofile-stats-grid">
        <div className="publicprofile-stat-card">
          <strong className="publicprofile-stat-value">{stats?.postsCount || 0}</strong>
          <p className="publicprofile-stat-label">{t("publicProfile.posts")}</p>
        </div>
        <div className="publicprofile-stat-card">
          <strong className="publicprofile-stat-value">{stats?.commentsCount || 0}</strong>
          <p className="publicprofile-stat-label">{t("publicProfile.comments")}</p>
        </div>
        <div className="publicprofile-stat-card">
          <strong className="publicprofile-stat-value">{stats?.usefulReceived || 0}</strong>
          <p className="publicprofile-stat-label">{t("publicProfile.usefulVotes")}</p>
        </div>
        <div className="publicprofile-stat-card">
          <strong className="publicprofile-stat-value">{stats?.uselessReceived || 0}</strong>
          <p className="publicprofile-stat-label">{t("publicProfile.uselessCount")}</p>
        </div>
        <div className="publicprofile-stat-card">
          <strong className="publicprofile-stat-value">{stats?.specializedReceived || 0}</strong>
          <p className="publicprofile-stat-label">{t("publicProfile.specialized")}</p>
        </div>
        <div className="publicprofile-stat-card">
          <strong className="publicprofile-stat-value">{user?.rooms?.length || 0}</strong>
          <p className="publicprofile-stat-label">{t("publicProfile.roomsJoined")}</p>
        </div>
      </div>

      {/* the major thinggis for profs....the ammount of shit i'm doing is insane.. */}
      {user?.role === "professor" && majors?.length > 0 && (
        <div className="publicprofile-majors-section">
          <h3 className="publicprofile-majors-title">{t("publicProfile.specialtyMajors")}</h3>
          {majors.map((major, index) => (
            <div key={index} className="publicprofile-major-item">
              <span className="publicprofile-major-name">{major}</span>
            </div>
          ))}
        </div>
      )}

      {/* recent posts */}
      <h3 className="publicprofile-posts-title">{t("publicProfile.recentPosts")}</h3>
      {posts.length === 0 ? (
        <p className="publicprofile-no-posts">{t("publicProfile.noPosts")}</p>
      ) : (
        posts.slice(0, 5).map(post => (
          <div key={post.id} className="publicprofile-post-card">
            {post.title && <h4 className="publicprofile-post-title">{post.title}</h4>}
            <p className="publicprofile-post-content" style={{ margin: "0 0 8px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>  {!expanded && post.content.length > LIMIT
    ? post.content.slice(0, LIMIT) + "..."
    : post.content}
  {/* {post.content.length > LIMIT && (
    <span
      onClick={() => setExpanded(!expanded)}
      style={{ color: "#8ca4c6", cursor: "pointer", fontSize: "13px", marginLeft: "4px" }}
    >
      {expanded ? " see less" : " see more"}
    </span>
  )} */}
  </p>
            <small className="publicprofile-post-date">{new Date(post.createdAt).toLocaleString()}</small>
          </div>
        ))
      )}

      {showReportUser && (
        <ReportModal
          type="user"
          targetId={userId}
          onClose={() => setShowReportUser(false)}
        />
      )}

    </div>
  );
}