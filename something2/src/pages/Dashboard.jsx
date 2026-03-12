import "../styles/Dash.css";
import "../styles/sidebar.css";
import Cat from "../photos/Cat.jpg";
 import { useNavigate } from "react-router-dom";
 import axios from "axios";


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
      const response = await axios.get("http://localhost:5000/api/posts", {
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
}, []);

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
  if (!postContent.trim()) return;
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://localhost:5000/api/posts",
      {
        content: postContent,
        title: "Post",
        roomId: "public"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPosts(prev => [response.data, ...prev]);
    setPostContent("");
    setIsModalOpen(false);
  } catch (err) {
    console.error("Failed to create post:", err);
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

        {/* <!-- Room Selection --> */}
        <section className="room-selection">
        {/* <label id="dashh3">Select rooms to view:</label> */}
        <select id="room-select" className="roomSelect" multiple size="5" style={{width:"30%"}}>
            <option value="" disabled >Select rooms to view:</option>
        {/* <!-- react will populate options --> */}
        </select>
        <input type="text"  id="dashSearch" className="dashSearch" placeholder="🔍 searching for something?" style={{float:"right" , width:"30%", border:" 2px, solid, #8ca4c6",height:"30px", padding:"3px", borderRadius:"6px"}}/>
        {/* i kinda lost the button heeeh.... */}
        <button id="postBtn" className="postBtn" style={{float:"right" , width:"15%",height:"30px", marginRight:"5px", padding:"3px", borderRadius:"6px" }}  onClick={() => setIsModalOpen(true)}>Write A Post📝</button>
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
    <div key={post.id} className="mock-post" style={{marginBottom:"5px", padding:"14px", borderRadius:"6px"}}>
      <strong>@{post.authorUsername}</strong>
      <small style={{marginLeft: "8px", opacity: 0.6}}>{post.roomId}</small>
      <p>{post.content}</p>
      <small>{new Date(post.createdAt).toLocaleString()}</small>
      <div style={{marginTop: "8px"}}>
        <button>👍 Useful {post.votes.useful}</button>
        <button style={{marginLeft: "8px"}}>👎 Useless {post.votes.useless}</button>
      </div>
    </div>
  ))
)}
            </div>
        </section>

        {/* <!-- Side Action Bar: this was old logic to be visited later..... --> */}
        {/* <div className="side-action-bar">
            <div className="icon-bar">
                <div className="icon-btn" id="postsBtn">📝</div>
                <div className="icon-btn" id="messagesBtn">💬</div>
                <div className="icon-btn" id="followersBtn">👥</div>
            </div>

            <div className="content-panel-container">
                <form className="content" id="postsPage">
                    📝 Write a Post
                    <label htmlFor="post-discription">Write Your Content</label><br/><br/>
                    <input type="text" id="post-title" placeholder="Title"/><br/>
                    <textarea id="post-discription" placeholder="Describe your flow..."></textarea><br/>
                    <button type="submit" id="sub">Submit</button>
                    <button type="reset" id="can">Cancel</button>
                </form>

                <div className="content" id="messagesPage">💬 Messages
                    <p>PRIVATE MESSAGES AND NOTIFICATIONS</p>
                </div>

                <div className="content" id="followersPage">👥 Followers
                    <p>FOLLOWERS LIST</p>
                </div>
            </div>
        </div> */}

    </main>
    {/* right down here we fuck around and find out */}
    {isModalOpen && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Write a Post</h3><br />
      {/* <input type="text" name="title" id="title"  placeholder="What's on your mind?" style={{width:"400px"}}/><br /><br /> */}

      <textarea style={{width:"400px",minHeight:"100px", padding:"10px"}}
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        placeholder="Describe your flow..."
      /> <br /><br />

      <div className="modal-actions">
        <button onClick={() => setIsModalOpen(false)} style={{width:" 70px"}}>Cancel</button>
        <button onClick={handleSubmitPost} style={{width:" 70px", marginLeft:"50px"}}>Post</button>
      </div>
    </div>
  </div>
)}
</div>
        </div>
    );
}