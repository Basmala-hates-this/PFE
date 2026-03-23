import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);



  const [isFollowing, setIsFollowing] = useState(false);
const [followLoading, setFollowLoading] = useState(false);

////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const [userRes, statsRes, postsRes, followersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/users/${userId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/posts/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/users/${userId}/followers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUser(userRes.data);
      setStats(statsRes.data);
      setPosts(postsRes.data);

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

  

// useEffect(() => {
//   if (!userId) return;
//   const checkFollowing = async () => {
//     try {
//       const response = await axios.get(
//         `http://localhost:5000/api/users/${userId}/followers`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const currentUser = JSON.parse(localStorage.getItem("currentUser"));
//       const alreadyFollowing = response.data.some(f => f.id === currentUser?.id);
//       console.log("checkFollowing result:", alreadyFollowing, "currentUser id:", currentUser?.id);

//       setIsFollowing(alreadyFollowing);
//     } catch (err) {
//       console.error("Failed to check following status:", err);
//     }
//   };
//   checkFollowing();
// }, [userId]);


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
      await axios.delete(`http://localhost:5000/api/users/${userId}/unfollow`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFollowing(false);
    } else {
      await axios.post(`http://localhost:5000/api/users/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    <div style={{minHeight:"100vh", background:"#1a1f35", color:"white", padding:"20px"}}>
      
      {/* back button */}
      <button onClick={() => navigate(-1)} style={{background:"none", border:"none", color:"white", fontSize:"20px", cursor:"pointer", marginBottom:"20px"}}>←</button>

      {/* profile card */}
      <div style={{background:"#252b45", borderRadius:"12px", padding:"20px", display:"flex", alignItems:"center", gap:"20px", marginBottom:"20px"}}>
        <img src={user?.profilePic || Cat} alt="pfp" style={{width:"80px", height:"80px", borderRadius:"50%", objectFit:"cover"}}/>
        <div>
          <h2 style={{margin:"0 0 6px"}}>@{user?.username}</h2>
          <small style={{background:"#6476af", color:"white", padding:"2px 8px", borderRadius:"10px", fontSize:"12px"}}>{user?.role}</small>
          <p style={{margin:"8px 0 4px", opacity:0.7}}>Major(s): {user?.majors?.join(", ")}</p>
          <p style={{margin:0, opacity:0.7}}>Rating: {user?.rating ?? 1} / 5</p>
        </div>
        <button 
              onClick={handleFollow}
              disabled={followLoading}
             style={{
                 padding:"8px 20px", 
                 borderRadius:"8px", 
                 background: isFollowing ? "transparent" : "#6476af", 
                  border: isFollowing ? "1px solid #6476af" : "none", 
                  color:"white", 
                  cursor:"pointer", 
                  fontSize:"14px"
               }}
               >
              {followLoading ? "..." : isFollowing ? "Following ✓" : "Follow"}
            </button>
            <button
              onClick={() => navigate(`/connections/${userId}`)}
              style={{padding:"8px 20px", borderRadius:"8px", background:"transparent", border:"1px solid #6476af", color:"white", cursor:"pointer", fontSize:"14px"}}
            >
                View Connections
            </button>
      </div>

      {/* stats */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"10px", marginBottom:"20px"}}>
  <div style={{background:"#252b45", borderRadius:"8px", padding:"15px", textAlign:"center"}}>
    <strong style={{fontSize:"22px"}}>{stats?.postsCount || 0}</strong>
    <p style={{margin:"4px 0 0", opacity:0.5, fontSize:"12px"}}>Posts 📝</p>
  </div>
  <div style={{background:"#252b45", borderRadius:"8px", padding:"15px", textAlign:"center"}}>
    <strong style={{fontSize:"22px"}}>{stats?.commentsCount || 0}</strong>
    <p style={{margin:"4px 0 0", opacity:0.5, fontSize:"12px"}}>Comments 🗨️</p>
  </div>
  <div style={{background:"#252b45", borderRadius:"8px", padding:"15px", textAlign:"center"}}>
    <strong style={{fontSize:"22px"}}>{stats?.usefulReceived || 0}</strong>
    <p style={{margin:"4px 0 0", opacity:0.5, fontSize:"12px"}}>Useful Votes 👍</p>
  </div>
  <div style={{background:"#252b45", borderRadius:"8px", padding:"15px", textAlign:"center"}}>
    <strong style={{fontSize:"22px"}}>{stats?.uselessReceived || 0}</strong>
    <p style={{margin:"4px 0 0", opacity:0.5, fontSize:"12px"}}>Useless Count ❌</p>
  </div>
  <div style={{background:"#252b45", borderRadius:"8px", padding:"15px", textAlign:"center"}}>
    <strong style={{fontSize:"22px"}}>{stats?.specializedReceived || 0}</strong>
    <p style={{margin:"4px 0 0", opacity:0.5, fontSize:"12px"}}>Specialized ✨</p>
  </div>
  <div style={{background:"#252b45", borderRadius:"8px", padding:"15px", textAlign:"center"}}>
    <strong style={{fontSize:"22px"}}>{user?.rooms?.length || 0}</strong>
    <p style={{margin:"4px 0 0", opacity:0.5, fontSize:"12px"}}>Rooms Joined 🏠</p>
  </div>
</div>


{/* the major thinggis for profs....the ammount of shit i'm doing is insane.. */}
{user?.role === "professor" && user?.majors?.length > 0 && (
  <div style={{background:"#252b45", borderRadius:"8px", padding:"15px", marginBottom:"20px"}}>
    <h3 style={{margin:"0 0 15px", color:"#5DADE2"}}>Specialty Majors</h3>
    {user.majors.map((major, index) => (
      <div key={index} style={{padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <span style={{color:"#85C1E9"}}>{major}</span>
      </div>
    ))}
  </div>
)}

      {/* recent posts */}
      <h3 style={{marginBottom:"15px"}}>Recent Posts</h3>
      {posts.length === 0 ? (
        <p style={{opacity:0.5}}>No posts yet.</p>
      ) : (
        posts.slice(0, 5).map(post => (
          <div key={post.id} style={{background:"#252b45", borderRadius:"8px", padding:"15px", marginBottom:"10px"}}>
            {post.title && <h4 style={{margin:"0 0 6px"}}>{post.title}</h4>}
            <p style={{margin:"0 0 8px", opacity:0.8, fontSize:"14px"}}>{post.content}</p>
            <small style={{opacity:0.5}}>{new Date(post.createdAt).toLocaleString()}</small>
          </div>
        ))
      )}

    </div>
  );
}