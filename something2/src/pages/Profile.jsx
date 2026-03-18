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
const handleDeleteAccount = () => {
  const confirmDelete = window.confirm(//i aint doing alert for this one...also can we remeber to close the terminal when we want t turn the pc off?this is causing problems..
    "Are you sure you want to delete your account? Whyyyyyy...I dont care,pass the checks first though."
  );

  if (!confirmDelete) return;//shit is a yes/no question..the hell u dont understand?

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (!currentUser) {
    navigate("/login");
    return;
  }


  //eehhhh...do you think the suer(user)should confirm their identety before deleting the account?
  //i mean we all have that one ANNOYING SIBLING THAT KEEPS MESSING AROUND
  //what are we thinkig?github requires the name of the repo before deleting it...but that is just the repo...
  //snapchat does that entire buggy email validation...
  //i think as simple as entring just the username.....or as secure as the password...
  // .lets do password and comment it until we decide
  //partner isnt responding to me....
  //anyhow
//   const passwordCheck = prompt("Enter your password to confirm deletion:");

// if (passwordCheck !== currentUser.password) {
//   alert("Incorrect password.");
//   return;
// }
//be mean and double check with the username?
//yeah this definitely not evil or cruel...i'm just being secure.....which one should come first though?
const usernameCheck = prompt("Enter your username to confirm deletion:");

if (usernameCheck !== currentUser.username) {
  alert("Incorrect username.");
  return;
}




  // remove user from users array
  const updatedUsers = users.filter(
    (u) => u.email !== currentUser.email
  );

  localStorage.setItem("users", JSON.stringify(updatedUsers));

  // remove session
  localStorage.removeItem("currentUser");//i forgot what i was going to say tbh...

  //  notify listeners that are useless but still exist because i'm too scared to delete them....damn it
  window.dispatchEvent(new Event("storage"));

  alert("Account deleted successfully....Bye");//yaay what most people will do if they ever created their accouns...
  navigate("/login");
};
//the irony is i'm making this all just around the local storage...this shit gonna hurt when backended

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