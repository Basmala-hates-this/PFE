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


//////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (!query) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const [postsRes, usersRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/posts/search?q=${query}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }),
          axios.get(`http://localhost:5000/api/users/search?q=${query}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setPosts(postsRes.data);
        setUsers(usersRes.data);
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
        <button
          onClick={() => setActiveTab("users")}
          style={{background:"none", border:"none", color: activeTab === "users" ? "white" : "rgba(255,255,255,0.4)", fontSize:"14px", cursor:"pointer", paddingBottom:"8px", borderBottom: activeTab === "users" ? "2px solid #6476af" : "none"}}
        >
          Users ({users.length})
        </button>
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
                    <img src={user.profilePic || Cat} alt="pfp" style={{width:"45px", height:"45px", borderRadius:"50%", objectFit:"cover"}}/>
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
    isGuest={false}
  />
)}

    </div>
  );
}