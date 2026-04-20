import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";

export default function ConnectionsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState("followers");
  const [loading, setLoading] = useState(true);

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
      style={{padding:"15px", background:"#252b45", borderRadius:"8px", marginBottom:"10px", display:"flex", alignItems:"center", gap:"12px", cursor:"pointer"}}
      onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
      onMouseLeave={e => e.currentTarget.style.background="#252b45"}
    >
      <img src={user.profilePicUrl || Cat} alt="pfp" style={{width:"45px", height:"45px", borderRadius:"50%", objectFit:"cover"}}/>
      <div>
        <strong>@{user.username}</strong>
        <small style={{display:"block", opacity:0.5, marginTop:"2px"}}>{user.role} • rating: {user.rating ?? 1} / 5</small>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh", background:"#1a1f35", color:"white", padding:"20px"}}>
      
      <div style={{display:"flex", alignItems:"center", gap:"15px", marginBottom:"20px"}}>
        <button onClick={() => navigate(-1)} style={{background:"none", border:"none", color:"white", fontSize:"20px", cursor:"pointer"}}>←</button>
        <h2 style={{margin:0}}>Connections</h2>
      </div>

      {/* tabs */}
      <div style={{display:"flex", gap:"10px", marginBottom:"20px", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"10px"}}>
        <button
          onClick={() => setActiveTab("followers")}
          style={{background:"none", border:"none", color: activeTab === "followers" ? "white" : "rgba(255,255,255,0.4)", fontSize:"14px", cursor:"pointer", paddingBottom:"8px", borderBottom: activeTab === "followers" ? "2px solid #6476af" : "none"}}
        >
          Followers ({followers.length})
        </button>
        <button
          onClick={() => setActiveTab("following")}
          style={{background:"none", border:"none", color: activeTab === "following" ? "white" : "rgba(255,255,255,0.4)", fontSize:"14px", cursor:"pointer", paddingBottom:"8px", borderBottom: activeTab === "following" ? "2px solid #6476af" : "none"}}
        >
          Following ({following.length})
        </button>
      </div>

      {loading ? (
        <p style={{opacity:0.5}}>Loading...</p>
      ) : (
        <>
          {activeTab === "followers" && (
            <div>
              {followers.length === 0 ? (
                <p style={{opacity:0.5}}>No followers yet.</p>
              ) : (
                followers.map(renderUser)
              )}
            </div>
          )}
          {activeTab === "following" && (
            <div>
              {following.length === 0 ? (
                <p style={{opacity:0.5}}>Not following anyone yet.</p>
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