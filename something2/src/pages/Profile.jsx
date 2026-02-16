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

//i was ignoring that big ass red delete  account button for a long while now....
//help me this is hell
//do it slowly
const handleDeleteAccount = () => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete your account? Whyyyyyy...I dont care,bye."
  );

  if (!confirmDelete) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (!currentUser) {
    navigate("/login");
    return;
  }

  // remove user from users array
  const updatedUsers = users.filter(
    (u) => u.email !== currentUser.email
  );

  // save updated users
  localStorage.setItem("users", JSON.stringify(updatedUsers));

  // remove session
  localStorage.removeItem("currentUser");

  //  notify listeners that are useless but still exist because i'm too scared to delete them....damn it
  window.dispatchEvent(new Event("storage"));

  alert("Account deleted successfully.");
  navigate("/login");
};


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
      <li onClick={() => navigate("/login")}><span>✌️ Logout </span></li>{/*should logout has a cnfirmation?...i'll judge on that based on how bad the confirmation of deleting an account would be*/ }
      <li className="delete-item"  onClick={handleDeleteAccount}><span>🗑️ Delete Account </span> </li>
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
        <p>Email: {user?.email}</p>

        <p>Major(s): {user?.majors?.join(", ")}</p>
        
          <p >tag: {user?.role}</p>{/*<!-- only one that showes later --> */}
         <p>rating: 3.5 </p>  {/* <!-- ⭐⭐⭐☆☆this should be either stars, number on 5 or a progress bar...maybe number is our best go here --> */}
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

    {/* <!-- COURSES this.....i still dont know how to use....bisicaly the distingtive factor of prof profile from student profile 
    how or what to do with it....i still dont know....maybe a list of majors and each major some rooms?--> */}
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