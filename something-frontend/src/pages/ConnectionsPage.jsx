// import { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import axios from "axios";
// import Cat from "../photos/Cat.jpg";
//  import { useTranslation } from 'react-i18next';

// export default function ConnectionsPage() {
//   const { userId } = useParams();
//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");

//   const [followers, setFollowers] = useState([]);
//   const [following, setFollowing] = useState([]);
//   const [activeTab, setActiveTab] = useState("followers");
//   const [loading, setLoading] = useState(true);
//    const { t } = useTranslation();
 
//   useEffect(() => {
//     const fetchConnections = async () => {
//       try {
//         const [followersRes, followingRes] = await Promise.all([
//           axios.get(`http://localhost:5000/api/users/${userId}/followers`, {
//             headers: { Authorization: `Bearer ${token}` }
//           }),
//           axios.get(`http://localhost:5000/api/users/${userId}/following`, {
//             headers: { Authorization: `Bearer ${token}` }
//           })
//         ]);
//         setFollowers(followersRes.data);
//         setFollowing(followingRes.data);
//       } catch (err) {
//         console.error("Failed to fetch connections:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchConnections();
//   }, [userId]);

//   const renderUser = (user) => (
//     <div key={user.id}
//       onClick={() => navigate(`/users/${user.id}`)}
//       style={{padding:"15px", background:"#252b45", borderRadius:"8px", marginBottom:"10px", display:"flex", alignItems:"center", gap:"12px", cursor:"pointer"}}
//       onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
//       onMouseLeave={e => e.currentTarget.style.background="#252b45"}
//     >
//       <img src={user.profile_pic_url || Cat} alt="pfp" style={{width:"45px", height:"45px", borderRadius:"50%", objectFit:"cover"}}/>
//       <div>
//         <strong>@{user.username}</strong>
//         <small style={{display:"block", opacity:0.5, marginTop:"2px"}}>{user.role} • {`${t("connections.rating")}: ${user.rating ?? 1} / 5`}</small>
//       </div>
//     </div>
//   );

//   return (
//     <div style={{minHeight:"100vh", background:"#1a1f35", color:"white", padding:"20px"}}>
      
//       <div style={{display:"flex", alignItems:"center", gap:"15px", marginBottom:"20px"}}>
//         <button onClick={() => navigate(-1)} style={{background:"none", border:"none", color:"white", fontSize:"20px", cursor:"pointer"}}>←</button>
//         <h2 style={{margin:0}}>{t("connections.title")}</h2>
//       </div>

//       {/* tabs */}
//       <div style={{display:"flex", gap:"10px", marginBottom:"20px", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"10px"}}>
//         <button
//           onClick={() => setActiveTab("followers")}
//           style={{background:"none", border:"none", color: activeTab === "followers" ? "white" : "rgba(255,255,255,0.4)", fontSize:"14px", cursor:"pointer", paddingBottom:"8px", borderBottom: activeTab === "followers" ? "2px solid #6476af" : "none"}}
//         >
//           {`${t("connections.followers")} (${followers.length})`}
//         </button>
//         <button
//           onClick={() => setActiveTab("following")}
//           style={{background:"none", border:"none", color: activeTab === "following" ? "white" : "rgba(255,255,255,0.4)", fontSize:"14px", cursor:"pointer", paddingBottom:"8px", borderBottom: activeTab === "following" ? "2px solid #6476af" : "none"}}
//         >
//           {`${t("connections.following")} (${following.length})`}
//         </button>
//       </div>

//       {loading ? (
//         <p style={{opacity:0.5}}>{t("connections.loading")}</p>
//       ) : (
//         <>
//           {activeTab === "followers" && (
//             <div>
//               {followers.length === 0 ? (
//                 <p style={{opacity:0.5}}>{t("connections.noFollowers")}</p>
//               ) : (
//                 followers.map(renderUser)
//               )}
//             </div>
//           )}
//           {activeTab === "following" && (
//             <div>
//               {following.length === 0 ? (
//                 <p style={{opacity:0.5}}>{t("connections.noFollowing")}</p>
//               ) : (
//                 following.map(renderUser)
//               )}
//             </div>
//           )}
//         </>
//       )}

//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import { useTranslation } from 'react-i18next';
import "../styles/connect.css"; // Import the CSS file

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
        const [followersRes, followingRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${userId}/followers`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/users/${userId}/following`, {
            headers: { Authorization: `Bearer ${token}` }
          })
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