import "../styles/Dash.css";
import "../styles/sidebar.css";
import Cat from "../photos/Cat.jpg";
 import { useNavigate } from "react-router-dom";
 import axios from "axios";
import Select from "react-select";
import { customSelect } from "../assets/components/selectStyles";


import { useRegistration } from "../assets/components/Context.jsx";
import "../styles/pallette.css"
import { useEffect, useState } from "react";


//sooooooooooo
//i'm too lazy to keep creating an account each time i want ot test something(refresh delets saved data )
//sooo why not work with both,context and localstorge?
//i meant context to creat the datashape "agreed upon" and local storage to save ot as is....
//deal?
//i imported the same thing twice and it made errors....u gotta love react...
//what are the chances that i can use don refrences in here?....
//as much as i know this would be a very bad idea....i wanna test it out....sorry sarah..i'm experementing again...
// //ignore that kind of comments..


//hheheheheheheh....since i hate my self now i can justify the pain i'm about to do....
//i'll make mokeup posts....just simple numbered blocks that appear when clicking the button to write a post ...
//this should be easy enough...but if not...then i already hate myself...maybe a nigative and a nigative will make it positive?hehehehehehe





export default function Dashboard() {
      const navigate = useNavigate();

const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [user, setUser] = useState(null);



//backen posts
const [posts, setPosts] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [postContent, setPostContent] = useState("");
const [loading, setLoading] = useState(false);

const [userRooms, setUserRooms] = useState([]);
const [selectedRooms, setSelectedRooms] = useState([]);
//scroling to the top of the code just to add a usestate u didnt even know you needed is absurd and biond me at this point

const [postTitle, setPostTitle] = useState("");
const [selectedPostRoom, setSelectedPostRoom] = useState(null);
const [selectedPost, setSelectedPost] = useState(null);


  //
  // If user skipped info/register, send them back
useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!storedUser) {
    navigate("/login");
    return;
  }

  setUser(storedUser);
}, [navigate]);


useEffect(() => {
  //maybe if this caused problems...change with useRef of react...only if necessary...which for now..it isnt..
  const lgm = document.getElementById("lgm");
  const body = document.body;

  if (!lgm) return;

  let savedTheme = localStorage.getItem("theme");

  if (!savedTheme) {
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    savedTheme = prefersLight ? "light" : "dark";
    localStorage.setItem("theme", savedTheme);
  }

  if (savedTheme === "light") {
    body.classList.add("light-mode");
    lgm.textContent = "🌙Dark Mode ";
  } else {
    lgm.textContent = "☀️Light Mode ";
  }

  const toggleTheme = () => {
    body.classList.toggle("light-mode");
    const mode = body.classList.contains("light-mode") ? "light" : "dark";
    localStorage.setItem("theme", mode);
    lgm.textContent = mode === "light" ? "🌙Dark Mode " : "☀️Light Mode ";
  };

  lgm.addEventListener("click", toggleTheme);

  return () => lgm.removeEventListener("click", toggleTheme);
}, []);


//listener to the update from editprofile page
useEffect(() => {
  const updateUser = () => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(storedUser);
  };

  window.addEventListener("storage", updateUser);

  return () => {
    window.removeEventListener("storage", updateUser);
  };
}, []);

//ehem...not so pround of that....eehhh...svaed global mock posts to local storage?->yeah,no..this gets them
useEffect(() => {
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // build the url based on selected rooms
      let url = "http://localhost:5000/api/posts";
      if (selectedRooms.length === 1) {
        url += `?roomId=${selectedRooms[0].value}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchPosts();
}, [selectedRooms]); // reruns when selectedRooms changes

//ze function to(can i call it function? or component? this entire page is a compenent though...anyhow finish the comment)create mock
const handleMockPost = () => {
  setMockPosts(prev => [//objet dde post....why did i turn french? brothaa eughhhh
    {
      id: prev.length + 1,
      author: user?.username || user?.fullname || "User",
      content: `Post #${prev.length + 1}`,
      time: new Date().toLocaleTimeString()
    },
    ...prev
  ]);
};//i think the one above is extra....that is just to spam button the feed...
//this one creates a semi blivable post and WE SAVE TO LOCALSTORAGE
//the one before just creats a should have been good enough block...
//THIS WILL EMITATE WHAT THE VISION MIGHT LOOK LIKE...
const handleSubmitPost = async () => {
  if (!postContent.trim() || !selectedPostRoom) return;
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://localhost:5000/api/posts",
      {
        content: postContent,
        title: postTitle || "Post",
        roomId: selectedPostRoom.value
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPosts(prev => [response.data, ...prev]);
    setPostContent("");
    setPostTitle("");
    setSelectedPostRoom(null);
    setIsModalOpen(false);
  } catch (err) {
    console.error("Failed to create post:", err);
  }
};

//fetching ze rooms for room filtaa
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

//the ammount of bugs is bugging me.....
//me stupid used the wrong api...
//u know how i like to be extra so instead of simple select or react select i want a fancy select for room filtration?
//....about that...
const groupedRoomOptions = [
  {
    label: "Public",
    options: userRooms
      .filter(r => r.type === "public")
      .map(r => ({ value: r.id, label: r.name }))
  },
  {
    label: "University",
    options: userRooms
      .filter(r => r.type === "university")
      .map(r => ({ value: r.id, label: r.name }))
  },
  {
    label: "Majors",
    options: userRooms
      .filter(r => r.type === "major")
      .map(r => ({ value: r.id, label: r.name }))
  },
  {
    label: "Private Rooms",
    options: userRooms
      .filter(r => r.type === "private")
      .map(r => ({ value: r.id, label: r.name }))
  }
].filter(group => group.options.length > 0); // remove empty groups


//ladies and gentemen.....the votes
const handleVote = async (postId, voteType) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.patch(
      `http://localhost:5000/api/posts/${postId}/vote`,
      { voteType },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // update the post in the feed without refetching everything
    setPosts(prev => prev.map(post => 
      post.id === postId ? response.data : post
    ));
  } catch (err) {
    console.error("Failed to vote:", err);
  }
};

//room name instead of id(me was stupid again)
const getRoomName = (roomId) => {
  const room = userRooms.find(r => r.id === roomId);
  return room ? room.name : roomId;
};

//ze comments my good living organisme
//screw it...this is the last i'll do today
//even if it didnt work
const handleAddComment = async (postId) => {
  const input = document.getElementById("commentInput");
  const content = input?.value.trim();
  if (!content) return;

  try {
    const token = localStorage.getItem("token");
    await axios.post(
      `http://localhost:5000/api/posts/${postId}/comments`,
      { content },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // refetch the post to get updated comments
    const response = await axios.get(
      `http://localhost:5000/api/posts/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // update the post in the feed
    setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
    // update selected post
    setSelectedPost(response.data);
    input.value = "";
  } catch (err) {
    console.error("Failed to add comment:", err);
  }
};
//i friking got lost in my own code....
const handleCommentVote = async (postId, commentId, voteType) => {
  try {
    const token = localStorage.getItem("token");
    await axios.patch(
      `http://localhost:5000/api/posts/${postId}/comments/${commentId}/vote`,
      { voteType },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // refetch the post to get updated comment votes
    const response = await axios.get(
      `http://localhost:5000/api/posts/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
    setSelectedPost(response.data);
  } catch (err) {
    console.error("Failed to vote on comment:", err);
  }
};



    return (
        <div id="body5">
            
<div className="dashboard">

    {/* <!-- Sidebar --> */}
    <aside className="sidebar">
        <h2>DASHBOARD</h2>
        <ul>
            <li><a href="#" id="home-link" onClick={() => navigate("/dashboard")}>Home</a></li>
            <li><a href="#" id="rooms-link">Rooms</a></li>
            <li><a href="#" onClick={() => navigate("/profile")}>Profile</a></li>
            {/* <li><a href="#" id="logoutBtn" onClick={() => navigate("/login")}>Logout</a></li> logout existing in both dashboard and profile was bugging me
            right now, lets just keep it in the profile....should it have a confirmation? */}
            <li><button id="lgm" className="lgm"  >☀️Light Mode </button></li>
        </ul>
    </aside>

    {/* <!-- Main content --> */}
    <main className="dashMain">
        {/* <!-- Header --> */}
        <header className="header">
            {/* <h1 className="welH1">Welcome <span id="usernameDisplay"></span></h1>...yeah it was a matter of time before i go back to react mind and remove dom shit */}
            {/* might remove full name though.... */}
            <h1 className="welH1">
  Welcome <span className="usernameDisplay">@{user?.username || user?.fullname || "User"} <small className="tag">{user?.role}
</small></span>
</h1>

            <img src={currentUser?.profilePic || Cat} alt="pfp" className="pfp" />
        </header>

        {/* why is simple css so damn hell?....was using css framwork going to make this worst or better?..guess we never gonna know */}
<section className="room-selection" style={{
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "15px"
}}>
  <div style={{ flex: 1 }}>
    <Select
      isMulti
      options={groupedRoomOptions}
      value={selectedRooms}
      onChange={(selected) => setSelectedRooms(selected || [])}
      placeholder="Select rooms to view..."
      styles={customSelect}
    />
  </div>

  <input 
    type="text" 
    id="dashSearch" 
    className="dashSearch" 
    placeholder="🔍 searching for something?" 
    style={{
      width: "25%",
      border: "2px solid #8ca4c6",
      height: "38px",
      padding: "3px 8px",
      borderRadius: "6px"
    }}
  />

  <button 
    id="postBtn" 
    className="postBtn" 
    style={{
      width: "15%",
      height: "38px",
      padding: "3px",
      borderRadius: "6px",
      whiteSpace: "nowrap"
    }} 
    onClick={() => setIsModalOpen(true)}
  >
    Write A Post📝
  </button>
</section>

        {/* <!-- Feed --> */}
        <section className="fyp-container">
            <h2 className="H2feed">Feed</h2>
            <div className="fyp-feed" id="fyp-feed">
                <p>ehh...the mock are just for funsies....this will not be at all the way this will be..i hope</p><br /><br />
                {loading ? (
  <p>Loading posts...</p>
) : posts.length === 0 ? (
  <p>No posts yet. Try writing one ✨</p>
) : (
  posts.map(post => (
    <div key={post.id} className="mock-post" style={{border:"1px solid #ccc",borderRadius:"30%",marginBottom:"5px", padding:"14px", borderRadius:"6px"}}>
      <div style={{  display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px"}}>
  <img 
    src={currentUser?.profilePic || Cat} 
    alt="pfp" 
    style={{width:"32px", height:"32px", borderRadius:"50%", objectFit:"cover"}}
  />
  <strong>@{post.authorUsername}</strong>
  <small style={{
    background:"#6476af", 
    color:"white", 
    padding:"2px 8px", 
    borderRadius:"10px",
    fontSize:"11px"
  }}>{post.authorRole || "user"}</small>
  <small style={{opacity:0.6}}>{getRoomName(post.roomId)}</small>
</div>
      <p>{post.content}</p>
      <small>{new Date(post.createdAt).toLocaleString()}</small>
      <div style={{marginTop: "8px"}}>
        <button onClick={() => handleVote(post.id, "useful")}>{post.votes.useful}👍 Useful </button>
        <button onClick={() => handleVote(post.id, "useless")} style={{marginLeft: "8px"}}>{post.votes.useless}👎 Useless </button>
        <button onClick={() => setSelectedPost(post)}  style={{marginLeft: "8px"}}>
         Comments {post.comments.length}
        </button>
      </div>
    </div>
  ))
)}
            </div>
        </section>

    </main>
    {/* right down here we fuck around and find out */}
 {isModalOpen && (
  <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Write a Post</h3>
        <button onClick={() => setIsModalOpen(false)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      <input 
        type="text"
        placeholder="Title (optional)"
        value={postTitle}
        onChange={(e) => setPostTitle(e.target.value)}
        style={{width:"100%", marginBottom:"10px", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box"}}
      />

      <Select
        options={groupedRoomOptions}
        value={selectedPostRoom}
        onChange={(selected) => setSelectedPostRoom(selected)}
        placeholder="Select a room to post in..."
        styles={customSelect}
      />
      <br/>

      <textarea
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        placeholder="Describe your flow..."
        style={{width:"100%", minHeight:"120px", padding:"10px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box", resize:"vertical"}}
      />
      <br/><br/>

      <div className="modal-actions" style={{display:"flex", justifyContent:"flex-end", gap:"10px"}}>
        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
        <button onClick={handleSubmitPost} disabled={!postContent.trim() || !selectedPostRoom}>Post</button>
      </div>

    </div>
  </div>
)}
{selectedPost && (
  <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
    <div className="modal" onClick={(e) => e.stopPropagation()} style={{width:"600px", maxHeight:"80vh", display:"flex", flexDirection:"column"}}>
      
      {/* header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Comments</h3>
        <button onClick={() => setSelectedPost(null)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer", color:"white"}}>✕</button>
      </div>

      {/* original post */}
      <div style={{padding:"12px", background:"rgba(255,255,255,0.05)", borderRadius:"8px", marginBottom:"15px"}}>
        <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px"}}>
          <img src={currentUser?.profilePic || Cat} alt="pfp" style={{width:"28px", height:"28px", borderRadius:"50%"}}/>
          <strong>@{selectedPost.authorUsername}</strong>
          <small style={{background:"#6476af", color:"white", padding:"2px 8px", borderRadius:"10px", fontSize:"11px"}}>{selectedPost.authorRole || "user"}</small>
        </div>
        <p style={{margin:0}}>{selectedPost.content}</p>
      </div>

      {/* comments list */}
      <div style={{flex:1, overflowY:"auto", marginBottom:"15px"}}>
        {selectedPost.comments.length === 0 ? (
          <p style={{opacity:0.5, textAlign:"center"}}>No comments yet. Be the first!</p>
        ) : (
          selectedPost.comments.map(comment => (
            <div key={comment.id} style={{padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
              
              {/* comment header */}
              <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px"}}>
                <img src={Cat} alt="pfp" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
                <strong style={{fontSize:"13px"}}>@{comment.authorUsername}</strong>
                <small style={{opacity:0.5, fontSize:"11px"}}>{new Date(comment.createdAt).toLocaleString()}</small>
              </div>

              {/* comment content */}
              <p style={{margin:"0 0 6px 32px", fontSize:"14px"}}>{comment.content}</p>

              {/* comment votes */}
              <div style={{margin:"4px 0 0 32px", display:"flex", gap:"8px", flexWrap:"wrap"}}>
                <button 
                  onClick={() => handleCommentVote(selectedPost.id, comment.id, "useful")}
                  style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer"}}>
                  👍 Useful {comment.votes.useful}
                </button>
                <button 
                  onClick={() => handleCommentVote(selectedPost.id, comment.id, "useless")}
                  style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer"}}>
                  👎 Useless {comment.votes.useless}
                </button>
                {/* specialized vote — only for OP or high rated users */}
                {(currentUser?.id === selectedPost.authorId || currentUser?.rating >= 4) && (
                  <button 
                    onClick={() => handleCommentVote(selectedPost.id, comment.id, "specialized")}
                    style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer", background:"#f0c040", border:"none"}}>
                    ⭐ Specialized {comment.votes.specialized}
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* add comment input */}
      <div style={{display:"flex", gap:"8px"}}>
        <input
          type="text"
          placeholder="Write a comment..."
          id="commentInput"
          style={{flex:1, padding:"8px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"white"}}
        />
        <button
          onClick={() => handleAddComment(selectedPost.id)}
          style={{padding:"8px 16px", borderRadius:"8px", background:"#6476af", border:"none", color:"white", cursor:"pointer"}}
        >
          Send
        </button>
      </div>

    </div>
  </div>
)}

</div>
        </div>
    );  }
      