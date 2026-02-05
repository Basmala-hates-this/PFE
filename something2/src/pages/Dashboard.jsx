import "../styles/Dash.css";
import "../styles/sidebar.css";
import Cat from "../photos/Cat.jpg";
 import { useNavigate } from "react-router-dom";
 import { useEffect } from "react";

import { useRegistration } from "../assets/components/Context.jsx";

//sooooooooooo
//i'm too lazy to keep creating an account each time i want ot test something(refresh delets saved data )
//sooo why not work with both,context and localstorge?
//i meant context to creat the datashape "agreed upon" and local storage to save ot as is....
//deal?
//i imported the same thing twice and it made errors....u gotta love react...




export default function Dashboard() {
      const navigate = useNavigate();
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  // If user skipped info/register, send them back
 useEffect(() => {
  if (!currentUser) {
    navigate("/login");
  }
}, [currentUser]);



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
            <li><a href="#" id="logoutBtn" onClick={() => navigate("/login")}>Logout</a></li>
            <li><button id="lgm" className="lgm" >Light Mode ☀️</button></li>
        </ul>
    </aside>

    {/* <!-- Main content --> */}
    <main className="main">
        {/* <!-- Header --> */}
        <header className="header">
            <h1>Welcome <span id="usernameDisplay"></span></h1>
            <img src={Cat} alt="pfp" className="pfp" />
        </header>

        {/* <!-- Room Selection --> */}
        <section className="room-selection">
        <h3 id="dashh3">Select rooms to view:</h3>
        <select id="room-select" multiple size="5">
        {/* <!-- react will populate options --> */}
        </select>
       </section>

        {/* <!-- Feed --> */}
        <section className="fyp-container">
            <h2>Feed</h2>
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