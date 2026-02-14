import gethub from "../photos/gethub.jpg";
import "../styles/profile.css";
import "../styles/sidebar.css";
 import { useNavigate } from "react-router-dom";
 import { useEffect, useState } from "react";



export default function Profile() { 
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  setUser(storedUser);
}, []);

//listener to the blah blah b;ah blah....u get the damn idea
useEffect(() => {
  const syncUser = () => {
    setUser(JSON.parse(localStorage.getItem("currentUser")));
  };

  window.addEventListener("storage", syncUser);

  return () => window.removeEventListener("storage", syncUser);
}, []);



    return (
<div id="body7">
    <div className="container">
  {/* <!-- SIDEBAR --> */}
  <aside className="sidebar">
    <h2 id="h2pro"> Profile</h2>
    <ul>
      <li onClick={() => navigate("/dashboard")}><span>👤 Dashboard </span></li>
      <li><span>🏠 Rooms </span></li>
      <li><span>🔒 Create Private Room </span></li>
      <li><span>📚 My Courses/resources </span></li>
      <li><span>👥 Connections </span></li>
      <li onClick={()=> navigate("/edit")}><span>⚙️ Edit </span></li>
      <li onClick={() => navigate("/login")}><span>✌️ Logout </span></li>
      <li className="delete-item" ><span>🗑️ Delete Account </span> </li>
    </ul>

  </aside>

  {/* <!-- MAIN --> */}
  <section className="main">

    {/* <!-- PROFILE --> */}
    <div className="profile-card">
      <img src={gethub} alt="Profile Picture" className="profile-pic" />
      <div className="profile-info">
        {/* yay dynamic updates in profile */}
        <h2>@{user?.username}</h2>
        <p>{user?.email}</p>

        <p> Computer Science Professor</p>
        
          <p>tag: prof/stdn</p>{/*<!-- only one that showes later --> */}
         <p>rating: ⭐⭐⭐☆☆ <small>based on 120 user</small></p>  {/* <!-- this should be either stars, number on 5 or a progress bar...maybe number is our best go here --> */}
      </div>
    </div>
{/* 
    <!-- STATS --> */}
    <div className="stats">
      <div className="stat-card"><span> Posts 📝</span><strong>180</strong></div>
      <div className="stat-card"><span>Comments 🗨️</span><strong>60</strong></div>
      <div className="stat-card"><span>Usefull Count👍</span><strong>24</strong></div>
      <div className="stat-card"><span> Useless Count ❌</span><strong>18</strong></div>
      <div className="stat-card"><span> Specialized✨</span><strong>6</strong></div>
      <div className="stat-card"><span>Rooms Joined 🏠</span><strong>24</strong></div>
    </div>

    {/* <!-- COURSES --> */}
    <div className="courses">
      <h3 style={{marginBottom:"15px",color:"#5DADE2"}}>My Majors</h3>

      <div className="course">
        <span style={{color:"#85C1E9"}}>Web Development</span>
        <strong>HTML, CSS & JavaScript</strong>
      </div>

      <div className="course">
        <span style={{color:"#85C1E9"}}>Software Engineering</span>
        <strong>UML & Design Patterns</strong>
      </div>

      <div className="course">
        <span style={{color:"#85C1E9"}}>Databases</span>
        <strong>SQL & NoSQL</strong>
      </div>
    </div>

  </section>
 
</div>
</div>
    );
}