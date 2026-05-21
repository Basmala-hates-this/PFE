import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import PostModal from "../assets/components/PostModal.jsx";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const token = localStorage.getItem("token");

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const [selectedPost, setSelectedPost] = useState(null);


  const guestToken = localStorage.getItem("guestToken");
const isGuest = !!guestToken;
const guestUniversities = JSON.parse(localStorage.getItem("guestUniversities")) || [];




//////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
  if (!query) return;
  const fetchResults = async () => {
    setLoading(true);
    try {
      const authHeader = token ? { Authorization: `Bearer ${token}` } : 
                         guestToken ? { Authorization: `Bearer ${guestToken}` } : {};

      const requests = [
        axios.get(`http://localhost:5000/api/posts/search?q=${query}`, {
          headers: authHeader
        })
      ];

      if (!isGuest) {
        requests.push(
          axios.get(`http://localhost:5000/api/users/search?q=${query}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      }

      const results = await Promise.all(requests);
      let filteredPosts = results[0].data;

      if (isGuest) {
        const roomsRes = await axios.get("http://localhost:5000/api/rooms/public-rooms");
        const selectedCodes = guestUniversities.map(u => u.value);
        const allowedRooms = roomsRes.data.filter(r =>
          r.type === "public" || selectedCodes.includes(r.university)
        );
        console.log("guest allowed rooms sample:", allowedRooms[0]);
        console.log("post sample:", filteredPosts[0]);
        const allowedRoomIds = allowedRooms.map(r => r.id);
        filteredPosts = filteredPosts.filter(p => allowedRoomIds.includes(p.roomId));
      } else {
        // filter by user's own rooms
        const roomsRes = await axios.get("http://localhost:5000/api/rooms/my-rooms", {
          headers: { Authorization: `Bearer ${token}` }
          

        });
        console.log("rooms sample:", roomsRes.data[0]);
console.log("posts sample:", results[0].data[0]);

        const allowedRoomIds = roomsRes.data
          .filter(r => r.type !== "private")
          .map(r => r.id);

        filteredPosts = filteredPosts.filter(p => allowedRoomIds.includes(p.roomId));
        
      }
      

      setPosts(filteredPosts);
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
setUsers(isGuest ? [] : results[1].data.filter(u => u.id !== currentUser.id));
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchResults();
}, [query]);


  
//////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

  return (
    <div style={{minHeight:"100vh", background:"#1a1f35", color:"white", padding:"20px"}}>
      
      {/* header */}
      <div style={{display:"flex", alignItems:"center", gap:"15px", marginBottom:"20px"}}>
        <button onClick={() => navigate("/dashboard")} style={{background:"none", border:"none", color:"white", fontSize:"20px", cursor:"pointer"}}>←</button>
        <h2 style={{margin:0}}>Results for "{query}"</h2>
      </div>

      {/* tabs */}
      <div style={{display:"flex", gap:"10px", marginBottom:"20px", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"10px"}}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{background:"none", border:"none", color: activeTab === "posts" ? "white" : "rgba(255,255,255,0.4)", fontSize:"14px", cursor:"pointer", paddingBottom:"8px", borderBottom: activeTab === "posts" ? "2px solid #6476af" : "none"}}
        >
          Posts ({posts.length})
        </button>
         {!isGuest && (
        <button
          onClick={() => setActiveTab("users")}
          style={{background:"none", border:"none", color: activeTab === "users" ? "white" : "rgba(255,255,255,0.4)", fontSize:"14px", cursor:"pointer", paddingBottom:"8px", borderBottom: activeTab === "users" ? "2px solid #6476af" : "none"}}
        >
          Users ({users.length})
        </button>
         )}
      </div>

      {loading ? (
        <p style={{opacity:0.5}}>Searching...</p>
      ) : (
        <>
          {/* posts tab */}
          {activeTab === "posts" && (
            <div>
              {posts.length === 0 ? (
                <p style={{opacity:0.5}}>No posts found for "{query}"</p>
              ) : (
                posts.map(post => (
                 <div key={post.id} 
                       onClick={() => setSelectedPost(post)}
                       style={{padding:"15px", background:"#252b45", borderRadius:"8px", marginBottom:"10px", cursor:"pointer"}}
                       onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
                       onMouseLeave={e => e.currentTarget.style.background="#252b45"}
                    >
                    <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px"}}>
                      <strong>@{post.authorUsername}</strong>
                      <small style={{background:"#6476af", color:"white", padding:"2px 8px", borderRadius:"10px", fontSize:"11px"}}>{post.authorRole || "user"}</small>
                    </div>
                    {post.title && <h3 style={{margin:"0 0 6px", fontSize:"15px"}}>{post.title}</h3>}
                    <p style={{margin:"0 0 8px", opacity:0.8, fontSize:"14px"}}>{post.content}</p>
                    <small style={{opacity:0.5}}>{new Date(post.createdAt).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          )}

          {/* users tab */}

          {activeTab === "users" && (
            <div>
              {users.length === 0 ? (
                <p style={{opacity:0.5}}>No users found for "{query}"</p>
              ) : (
                users.map(user => (
                  <div key={user.id} 
                    onClick={() => navigate(`/users/${user.id}`)}
                     style={{padding:"15px", background:"#252b45", borderRadius:"8px", marginBottom:"10px", display:"flex", alignItems:"center", gap:"12px", cursor:"pointer"}}
                     onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
                     onMouseLeave={e => e.currentTarget.style.background="#252b45"}
                   >
                    <img src={user.profile_pic_url || Cat} alt="pfp" style={{width:"45px", height:"45px", borderRadius:"50%", objectFit:"cover"}}/>
                    <div>
                      <strong>@{user.username}</strong>
                      <small style={{display:"block", opacity:0.5, marginTop:"2px"}}>{user.role} • rating: {user.rating ?? 1} / 5</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}


      {selectedPost && (
  <PostModal
    postId={selectedPost.id}
    onClose={() => setSelectedPost(null)}
    isGuest={isGuest}
  />
)}

    </div>
  );
}