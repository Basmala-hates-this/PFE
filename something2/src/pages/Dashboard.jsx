import "../styles/Dash.css";
import "../styles/sidebar.css";
import Cat from "../photos/Cat.jpg";
 import { useNavigate } from "react-router-dom";


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





export default function Dashboard() {
      const navigate = useNavigate();
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [user, setUser] = useState(null);
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
    lgm.textContent = "Dark Mode 🌙";
  } else {
    lgm.textContent = "Light Mode ☀️";
  }

  const toggleTheme = () => {
    body.classList.toggle("light-mode");
    const mode = body.classList.contains("light-mode") ? "light" : "dark";
    localStorage.setItem("theme", mode);
    lgm.textContent = mode === "light" ? "Dark Mode 🌙" : "Light Mode ☀️";
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
            <li><button id="lgm" className="lgm"  >Light Mode ☀️</button></li>
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

            <img src={Cat} alt="pfp" className="pfp" />
        </header>

        {/* <!-- Room Selection --> */}
        <section className="room-selection">
        {/* <label id="dashh3">Select rooms to view:</label> */}
        <select id="room-select" className="roomSelect" multiple size="5" style={{width:"30%"}}>
            <option value="" disabled >Select rooms to view:</option>
        {/* <!-- react will populate options --> */}
        </select>
        <input type="text"  id="dashSearch" className="dashSearch" placeholder="🔍 searching for something?" style={{float:"right" , width:"30%", border:" 2px, solid, #8ca4c6",height:"30px", padding:"3px", borderRadius:"6px"}}/>
        <button id="postBtn" className="postBtn" style={{float:"right" , width:"15%",height:"30px", marginRight:"5px", padding:"3px", borderRadius:"6px" }}>Write A Post📝</button>
       </section>

        {/* <!-- Feed --> */}
        <section className="fyp-container">
            <h2 className="H2feed">Feed</h2>
            <div className="fyp-feed" id="fyp-feed">
                <p>Select rooms to see posts...</p>
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
</div>
        </div>
    );
}