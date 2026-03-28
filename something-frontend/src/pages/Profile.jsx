import cat from "../photos/cat.jpg";
import "../styles/profile.css";
import "../styles/sidebar.css";
 import { useNavigate } from "react-router-dom";
 import { useEffect, useState } from "react";
 import axios from "axios";
 import PostModal from "../assets/components/PostModal.jsx";



export default function Profile() { 
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const [stats, setStats] = useState(null);



    const isProfessor=user?.role === "professor";

    //remember when i said info was the biggist page to be?...
    //well, i lied...that would be the dashboard and this damn profile pagge......
    //moving on i wanted private rooms...i'll get me private rooms
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [roomPassKey, setRoomPassKey] = useState("");
    const [useGeneratedKey, setUseGeneratedKey] = useState(true);
    const [roomFeedback, setRoomFeedback] = useState("");

    //the damn modal is killing me...
    //join room related shit
    const [showJoinRoom, setShowJoinRoom] = useState(false);
    const [joinPassKey, setJoinPassKey] = useState("");
    const [joinFeedback, setJoinFeedback] = useState("");

    //private room ui shit
    const [userRooms, setUserRooms] = useState([]);
    const [showMyRooms, setShowMyRooms] = useState(false);
    const [following, setFollowing] = useState([]);
    const [invitedUsers, setInvitedUsers] = useState([]);
    const [roomLoading, setRoomLoading] = useState(false);


    //resources things and shit...i am fasting btw...
    const [showSavedPosts, setShowSavedPosts] = useState(false);
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedPostsLoading, setSavedPostsLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);


    const [savedTab, setSavedTab] = useState("all");
    const [savedSearch, setSavedSearch] = useState("");


useEffect(() => {
  const token = localStorage.getItem("token");
  axios.get("http://localhost:5000/api/users/me", {
    headers: { Authorization: `Bearer ${token}` }
  }).then((res) => {
    setUser(res.data);
  }).catch((err) => {
    console.error("Failed to fetch user:", err);
  });
}, []);

//listener to the blah blah b;ah blah....u get the damn idea
useEffect(() => {
  const syncUser = () => {
    setUser(JSON.parse(localStorage.getItem("currentUser")));
  };

  window.addEventListener("storage", syncUser);

  return () => window.removeEventListener("storage", syncUser);
}, []);

//i was ignoring that big ass red delete  account button for a long while now....
//help me this is hell
//do it slowly
const handleDeleteAccount = async () => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete your account? Whyyyyyy...I dont care, pass the check first though."
  );
  if (!confirmDelete) return;//shit is a yes or no question....what dont ur ass understand

//soooo...i wanted 2 steps of confirmation...but thought better of it...
  const usernameCheck = prompt("Enter your username to confirm deletion:");
  if (usernameCheck !== user?.username) {
    alert("Incorrect username.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    await axios.delete("http://localhost:5000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    alert("Account deleted successfully.... Bye");//yeeeey what most will do if they actually created their accounts...kill me
    navigate("/login");
  } catch (err) {
    console.error("Failed to delete account:", err);
    alert("Something went wrong.");
  }
};
//the irony is i'm making this all just around the local storage...this shit gonna hurt when backended
//suck it up backend....that is honestly killing me ngl

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  navigate("/login");
};


//bout time we git rid of those hard coded stats...right?
useEffect(() => {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/users/me/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };
  fetchStats();
}, []);


useEffect(() => {
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/rooms/my-rooms", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRooms(response.data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  };
  fetchRooms();
}, []);



useEffect(() => {
  if (!showCreateRoom) return;
  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/users/${user?.id}/following`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFollowing(res.data);
    } catch (err) {
      console.error("Failed to fetch following:", err);
    }
  };
  fetchFollowing();
}, [showCreateRoom]);



////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////// 

//into the habit of declaring states..then effects..the functions to need....started it lately without realizing....i fear of having to debug the old ones that doeas not have this devision
const handleCreateRoom = async () => {
  setRoomLoading(true);
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://localhost:5000/api/rooms/private",
      {
        name: roomName,
        passKey: useGeneratedKey ? null : roomPassKey,
        invitedUsers: invitedUsers,

      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const createdRoom = response.data;
    setRoomFeedback(`Room created! Your passkey is: ${createdRoom.passKey} — share this with people you want to invite.`);
    setRoomName("");
    setRoomPassKey("");
    setUseGeneratedKey(true);
    setInvitedUsers([]);

  } catch (err) {
    setRoomFeedback(err.response?.data?.message || "Something went wrong.");
  } finally {
    setRoomLoading(false);
  } 
};

//join shit
const handleJoinRoom = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://localhost:5000/api/rooms/private/join",
      { passKey: joinPassKey },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setJoinFeedback(response.data.message);
    setJoinPassKey("");
  } catch (err) {
    setJoinFeedback(err.response?.data?.message || "Something went wrong.");
  }
};



const fetchSavedPosts = async () => {
  setSavedPostsLoading(true);
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/posts/saved", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSavedPosts(res.data);
  } catch (err) {
    console.error("Failed to fetch saved posts:", err);
  } finally {
    setSavedPostsLoading(false);
  }
};
/////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
    return (
<div id="body7">
    <div className="container">
  {/* <!-- SIDEBAR --> */}
  <aside className="sidebar">
    <h2 id="h2pro"> Profile</h2>
    <ul>
      <li onClick={() => navigate("/dashboard")}><span> Dashboard </span></li>
      <li onClick={() => setShowMyRooms(true)} ><span>My Rooms </span></li>
      <li onClick={() => setShowCreateRoom(true)}><span>Create Private Room </span></li>
      <li onClick={() => setShowJoinRoom(true)}><span>Join Private Room </span></li>
      <li onClick={() => { setShowSavedPosts(true); fetchSavedPosts(); }}><span>My Saved Posts</span></li>
      <li onClick={() => navigate(`/connections/${user?.id}`)}><span> Connections </span></li>
      <li onClick={()=> navigate("/edit")}><span> Edit </span></li>
     {(user?.authorityLevel === "admin" || user?.authorityLevel === "superadmin") && (
      <li onClick={() => navigate("/admin")}><span>🛡️ Admin Panel</span></li>
      )}
      <li onClick={handleLogout}><span> Logout </span></li>{/*should logout has a cnfirmation?...i'll judge on that based on how bad the confirmation of deleting an account would be*/ }
      <li className="delete-item"  onClick={handleDeleteAccount}><span> Delete Account </span> </li>
    </ul>

  </aside>

  {/* <!-- MAIN --> */}
  <section className="main">

    {/* <!-- PROFILE --> */}
    <div className="profile-card">
      <img src={user?.profilePic || cat} alt="Profile Picture" className="profile-pic" />
      <div className="profile-info">
        {/* yay dynamic updates in profile */}
        <h2>@{user?.username}</h2>
        <p>Email: {user?.email}</p>

        <p>Major(s): {user?.majors?.join(", ")}</p>
        
          <p >tag: {user?.role}</p>{/*<!-- only one that showes later --> */}
         <p>rating: {user?.rating ?? 1} / 5 </p>  {/* <!-- ⭐⭐⭐☆☆this should be either stars, number on 5 or a progress bar...maybe number is our best go here --> */}
      </div>
    </div>
{/* 
    <!-- STATS --> */}
    <div className="stats">
      <div className="stat-card"><span> Posts 📝</span><strong>{stats?.postsCount || 0}</strong></div>
      <div className="stat-card"><span>Comments 🗨️</span><strong>{stats?.commentsCount || 0}</strong></div>
      <div className="stat-card"><span>Usefull Count👍</span><strong>{stats?.usefulReceived || 0}</strong></div>
      <div className="stat-card"><span> Useless Count ❌</span><strong>{stats?.uselessReceived || 0}</strong></div>
      <div className="stat-card"><span> Specialized✨</span><strong>{stats?.specializedReceived || 0}</strong></div>
      <div className="stat-card"><span>Rooms Joined 🏠</span><strong>{user?.rooms?.length || 0}</strong></div>
    </div>

    {/* <!-- COURSES this.....i still dont know how to use....bisicaly the distingtive factor of prof profile from student profile 
    how or what to do with it....i still dont know....maybe a list of majors and each major some rooms?--> */}
    {/* { isProfessor && (<div className="courses">
      <h3 style={{marginBottom:"15px",color:"#5DADE2"}}>Specialty  Majors</h3>

      <div className="course">
        <span style={{color:"#85C1E9"}}>Web Development</span>
       
      </div>

      <div className="course">
        <span style={{color:"#85C1E9"}}>Software Engineering</span>
        
      </div>

      <div className="course">
        <span style={{color:"#85C1E9"}}>Databases</span>
       
      </div>
    </div>
)} */}
{/* soooo...dynamic display of majors? */}
{isProfessor && user?.majors?.length > 0 && (
  <div className="courses">
    <h3 style={{ marginBottom: "15px", color: "#5DADE2" }}>Specialty Majors</h3>

    {user.majors.map((major, index) => (
      <div className="course" key={index}>
        <span style={{ color: "#85C1E9" }}>{major}</span>
        {/* the listing of rooms maybe? */}
      </div>
    ))}
  </div>
)}
  </section>
 
</div>

{/* create private room modal...i ned to login to test this...damn */}
{showCreateRoom && (
  <div className="modal-overlay" onClick={() => setShowCreateRoom(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Create Private Room</h3>
        <button onClick={() => setShowCreateRoom(false)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      <label>Room Name</label>
      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Enter room name..."
        style={{width:"100%", marginBottom:"10px", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box"}}
      />

      <label>
        <input
          type="checkbox"
          checked={useGeneratedKey}
          onChange={() => {
            setUseGeneratedKey(!useGeneratedKey);
            setRoomPassKey("");
          }}
        /> Generate passkey automatically
      </label>
      <br/><br/>

      {!useGeneratedKey && (
        <input
          type="text"
          value={roomPassKey}
          onChange={(e) => setRoomPassKey(e.target.value)}
          placeholder="Enter your own passkey..."
          maxLength={8}
          style={{width:"100%", marginBottom:"10px", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box"}}
        />
      )}

      {following.length > 0 && (

              <div style={{marginBottom:"15px"}}>
               <label>Invite from your following:</label>
                 <div style={{maxHeight:"150px", overflowY:"auto", marginTop:"8px", display:"flex", flexDirection:"column", gap:"8px"}}>
                {following.map(u => (
                 <label key={u.id} style={{display:"flex", alignItems:"center", gap:"10px", cursor:"pointer"}}>
                   <input
                      type="checkbox"
                     checked={invitedUsers.includes(u.id)}
                     onChange={() => {
                     setInvitedUsers(prev =>
                      prev.includes(u.id)
                        ? prev.filter(id => id !== u.id)
                     : [...prev, u.id]
                   );
                  }}
                 />
                 @{u.username} — {u.role}
             </label>
            ))}
           </div>
         </div>
        )}

      {roomFeedback && (
        <p style={{color: roomFeedback.includes("!") ? "lightgreen" : "#fc0c0ce9", marginBottom:"10px"}}>
          
          {roomFeedback}
        </p>
      )}

      <div style={{display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"15px"}}>
        <button onClick={() => setShowCreateRoom(false)}>Cancel</button>
        <button onClick={handleCreateRoom} disabled={!roomName.trim() || roomLoading}>
        {roomLoading ? "Creating..." : "Create"}
        </button>
      </div>

    </div>
  </div>
)}


{/* join shit */}
{showJoinRoom && (
  <div className="modal-overlay" onClick={() => setShowJoinRoom(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Join Private Room</h3>
        <button onClick={() => setShowJoinRoom(false)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      <label>Enter Passkey</label>
      <input
        type="text"
        value={joinPassKey}
        onChange={(e) => setJoinPassKey(e.target.value)}
        placeholder="Enter 8 character passkey..."
        maxLength={8}
        style={{width:"100%", marginBottom:"10px", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box"}}
      />

      {joinFeedback && (
        <p style={{color: joinFeedback.includes("Welcome") ? "lightgreen" : "#fc0c0ce9", marginBottom:"10px"}}>
          {joinFeedback}
        </p>
      )}

      <div style={{display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"15px"}}>
        <button onClick={() => setShowJoinRoom(false)}>Cancel</button>
        <button onClick={handleJoinRoom} disabled={joinPassKey.length !== 8}>Join</button>
      </div>

    </div>
  </div>
)}




{/* other shit */}
{showMyRooms && (
  <div className="modal-overlay" onClick={() => setShowMyRooms(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>My Rooms</h3>
        <button onClick={() => setShowMyRooms(false)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      {userRooms.length === 0 ? (
        <p style={{opacity:0.5, textAlign:"center"}}>No rooms yet.</p>
      ) : (
        userRooms.map(room => (
          <div key={room.id} style={{padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <strong>{room.name}</strong>
              <small style={{marginLeft:"8px", background:"#6476af", color:"white", padding:"2px 8px", borderRadius:"10px", fontSize:"11px"}}>{room.type}</small>
            </div>
            {room.type === "private" && (
              <button
                onClick={() => {
                  setShowMyRooms(false);
                  navigate(`/rooms/${room.id}`);
                }}
                style={{padding:"6px 12px", borderRadius:"6px", background:"#6476af", border:"none", color:"white", cursor:"pointer"}}
              >
                Open Chat
              </button>
            )}
          </div>
        ))
      )}

    </div>
  </div>
)}



{showSavedPosts && (
  <div className="modal-overlay" onClick={() => setShowSavedPosts(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxHeight:"80vh", overflowY:"auto"}}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>🔖 Saved Posts</h3>
        <button onClick={() => setShowSavedPosts(false)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      {/* search */}
      <input
        type="text"
        placeholder="Search saved posts..."
        value={savedSearch}
        onChange={(e) => setSavedSearch(e.target.value)}
        style={{width:"100%", padding:"8px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"white", boxSizing:"border-box", marginBottom:"12px"}}
      />

      {/* tabs */}
      <div style={{display:"flex", gap:"6px", marginBottom:"15px", flexWrap:"wrap"}}>
        {["all", "posts", "images", "files", "links"].map(tab => (
          <button
            key={tab}
            onClick={() => setSavedTab(tab)}
            style={{
              padding:"4px 12px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"12px",
              background: savedTab === tab ? "#6476af" : "rgba(255,255,255,0.1)",
              color: "white"
            }}
          >
            {tab === "all" && "📚 All"}
            {tab === "posts" && "📝 Posts"}
            {tab === "images" && "🖼️ Images"}
            {tab === "files" && "📄 Files"}
            {tab === "links" && "🔗 Links"}
          </button>
        ))}
      </div>

      {savedPostsLoading ? (
        <p style={{opacity:0.5, textAlign:"center"}}>Loading...</p>
      ) : (() => {
          const filtered = savedPosts.filter(post => {
            // tab filter
            if (savedTab === "posts" && (post.image || post.pdf || post.resourceLink)) return false;
            if (savedTab === "images" && !post.image) return false;
            if (savedTab === "files" && !post.pdf) return false;
            if (savedTab === "links" && !post.resourceLink) return false;

            // search filter
            if (savedSearch.trim()) {
              const q = savedSearch.toLowerCase();
              return (
                post.title?.toLowerCase().includes(q) ||
                post.content?.toLowerCase().includes(q) ||
                post.authorUsername?.toLowerCase().includes(q) ||
                post.resourceLabel?.toLowerCase().includes(q)
              );
            }
            return true;
          });

          return filtered.length === 0 ? (
            <p style={{opacity:0.5, textAlign:"center"}}>Nothing here yet.</p>
          ) : (
            filtered.map(post => (
              <div
                key={post.id}
                onClick={() => { setShowSavedPosts(false); setSelectedPost(post); }}
                style={{padding:"12px", background:"rgba(255,255,255,0.05)", borderRadius:"8px", marginBottom:"10px", cursor:"pointer"}}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}
              >
                <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px"}}>
                  <strong style={{fontSize:"14px"}}>@{post.authorUsername}</strong>
                  <small style={{background:"#6476af", color:"white", padding:"2px 8px", borderRadius:"10px", fontSize:"11px"}}>{post.authorRole || "user"}</small>
                  {/* attachment indicators */}
                  <div style={{marginLeft:"auto", display:"flex", gap:"4px"}}>
                    {post.image && <span style={{fontSize:"12px"}}>🖼️</span>}
                    {post.pdf && <span style={{fontSize:"12px"}}>📄</span>}
                    {post.resourceLink && <span style={{fontSize:"12px"}}>🔗</span>}
                  </div>
                </div>
                {post.title && <h4 style={{margin:"0 0 4px", fontSize:"14px"}}>{post.title}</h4>}
                <p style={{margin:"0 0 6px", opacity:0.7, fontSize:"13px"}}>{post.content?.slice(0, 100)}...</p>
                {post.resourceLabel && (
                  <small style={{opacity:0.5, fontSize:"11px"}}>🔗 {post.resourceLabel}</small>
                )}
                <small style={{display:"block", opacity:0.4, fontSize:"11px", marginTop:"4px"}}>{new Date(post.createdAt).toLocaleString()}</small>
              </div>
            ))
          );
        })()
      }

    </div>
  </div>
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