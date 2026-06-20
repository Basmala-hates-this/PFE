
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import { useTranslation } from 'react-i18next';
import "../styles/connect.css"; // Import the CSS file
import api from "../api/axios.js";

export default function ConnectionsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState("followers");
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        // const [followersRes, followingRes] = await Promise.all([
        //   axios.get(`http://localhost:5000/api/users/${userId}/followers`, {
        //     headers: { Authorization: `Bearer ${token}` }
        //   }),
        //   axios.get(`http://localhost:5000/api/users/${userId}/following`, {
        //     headers: { Authorization: `Bearer ${token}` }
        //   })
        // ]);
        const [followersRes, followingRes] = await Promise.all([
  api.get(`/users/${userId}/followers`),
  api.get(`/users/${userId}/following`)
]);
        setFollowers(followersRes.data);
        setFollowing(followingRes.data);
      } catch (err) {
        console.error("Failed to fetch connections:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, [userId]);

  const renderUser = (user) => (
    <div key={user.id}
      onClick={() => navigate(`/users/${user.id}`)}
      className="connections-user-card"
    >
      <img src={user.profile_pic_url || Cat} alt="pfp" className="connections-user-avatar"/>
      <div className="connections-user-info">
        <strong className="connections-username">@{user.username}</strong>
        <small className="connections-user-details">{user.role} • {`${t("connections.rating")}: ${user.rating ?? 1} / 5`}</small>
      </div>
    </div>
  );

  return (
    <div className="connections-container">
      
      <div className="connections-header">
        <button onClick={() => navigate(-1)} className="connections-back-button">←</button>
        <h2 className="connections-title">{t("connections.title")}</h2>
      </div>

      {/* tabs */}
      <div className="connections-tabs">
        <button
          onClick={() => setActiveTab("followers")}
          className={`connections-tab ${activeTab === "followers" ? "connections-tab-active" : "connections-tab-inactive"}`}
        >
          {`${t("connections.followers")} (${followers.length})`}
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`connections-tab ${activeTab === "following" ? "connections-tab-active" : "connections-tab-inactive"}`}
        >
          {`${t("connections.following")} (${following.length})`}
        </button>
      </div>

      {loading ? (
        <p className="connections-loading">{t("connections.loading")}</p>
      ) : (
        <>
          {activeTab === "followers" && (
            <div>
              {followers.length === 0 ? (
                <p className="connections-empty">{t("connections.noFollowers")}</p>
              ) : (
                followers.map(renderUser)
              )}
            </div>
          )}
          {activeTab === "following" && (
            <div>
              {following.length === 0 ? (
                <p className="connections-empty">{t("connections.noFollowing")}</p>
              ) : (
                following.map(renderUser)
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}