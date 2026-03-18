import cat from "../photos/cat.jpg";
import "../styles/profile.css";
import "../styles/sidebar.css";
 import { useNavigate } from "react-router-dom";
 import { useEffect, useState } from "react";
 import axios from "axios";



export default function Profile() { 
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const [stats, setStats] = useState(null);


    const isProfessor=user?.role === "professor";


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




    return (
<div id="body7">
    <div className="container">
  {/* <!-- SIDEBAR --> */}
  <aside className="sidebar">
    <h2 id="h2pro"> Profile</h2>
    <ul>
      <li onClick={() => navigate("/dashboard")}><span> Dashboard </span></li>
      <li><span>Rooms </span></li>
      <li><span>Create Private Room </span></li>
      <li><span>My Courses/resources </span></li>
      <li><span> Connections </span></li>
      <li onClick={()=> navigate("/edit")}><span> Edit </span></li>
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
</div>
    );
}