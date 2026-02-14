import "../styles/editProfile.css"
import cat from "../photos/Cat.jpg"
 import { useNavigate } from "react-router-dom";
 import { useEffect } from "react";
 import { useState } from "react";

  import {validateUsername, isValidEmail} from "../assets/components/Validations.js";
//the amount of steeling aand fixer upper from other pages is concerning concidering i'm a "programmer"
//if i already have it why re-write ir .....right?

export default function EditProfile(){
 const navigate = useNavigate();

  const [username, setUsername] = useState("");
   const [usernameFeedback, setUsernameFeedback] = useState("");
   const [usernameColor, setUsernameColor] = useState("");
   const [editEmail, setEditEmail] = useState("");
   

  

//...fill the form with current user's data?....this is making the feedback strip show up....maybe just remove it?...
// useEffect(() => {
//   const currentUser = JSON.parse(localStorage.getItem("currentUser"));
//   if (currentUser) {
//     setUsername(currentUser.username);
//     setEditEmail(currentUser.email);
//   }
// }, []);



  const handleUsernameChange = (e) => {
  const value = e.target.value;
  setUsername(value);
  
  if (value.length === 0) {
    setUsernameFeedback("");
    setUsernameColor("");
    return;
  }

  const result = validateUsername(value);
  setUsernameFeedback(result.message);
  setUsernameColor(result.color);
};

const handleSubmit = (e) => {
  e.preventDefault();


  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {//useless but go with me...better safe then app crash...
    alert("No active user found.");//sidn in bro...
    return;
  }

  //my coding that  ALWAYS CAUSES PROBLEMS...i'm validating everything...
  //i only need to validate what is being filled///pause...
  //anyhow....
    //little   something something...we check if the data given is similar to another account or the account itself

  // Determine what is actually being changed
  const isChangingUsername =
    username.trim() !== "" && username !== currentUser.username;

  const isChangingEmail =
    editEmail.trim() !== "" && editEmail !== currentUser.email;

  // If nothing changed
  if (!isChangingUsername && !isChangingEmail) {
    alert("Nothing to update.u discovering?");
    return;
  }

  // Validate username ONLY if changing it
  if (isChangingUsername) {
    const result = validateUsername(username);
    if (!result.valid) {
      alert(result.message);
      return;
    }

    const usernameExists = users.some(
      (u) => u.username === username && u.email !== currentUser.email
    );

    if (usernameExists) {
    alert("Username already taken...be more creative bro");
      return;
    }
  }

  //  Validate email ONLY if changing it
  if (isChangingEmail) {
    if (!isValidEmail(editEmail)) {
      alert("Invalid email.");
      return;
    }

    const emailExists = users.some(
      (u) => u.email === editEmail && u.email !== currentUser.email
    );

    if (emailExists) {
      alert("Email already exists.");
      return;
    }
  }


  

  // Update current user
 const updatedUser = {
    ...currentUser,
    username: isChangingUsername ? username : currentUser.username,
    email: isChangingEmail ? editEmail : currentUser.email,
  };

  // Update users array
  const updatedUsers = users.map((u) =>
    u.email === currentUser.email ? updatedUser : u
  );

  // Save everything
  localStorage.setItem("users", JSON.stringify(updatedUsers));
  localStorage.setItem("currentUser", JSON.stringify(updatedUser));

  //soooooooooo...since shit is stubern...u cant see the update until the page is refreshed....fix:
  window.dispatchEvent(new Event("storage"));
//react will listen to this damn thing changing the localstorae and "live update" the data....might as well test that out.
//am i stupid....i really  might be....i'm using damn react...
//navigating away will push to rerender and reread the data...thus i dont need the damn thing...but if u want to change the user name then change it back...
//which maybe...people like me would do(change to something then back to the original imediatly)....this might be usefull....nah its not but i'm not removig it ..atleast for now


  alert("Profile updated successfully!");
  navigate("/profile");
};



    return(
<div id="body9"><form id="profileForm" onSubmit={handleSubmit}>
<div className="edit-profile-card">
        <div className="page-title">
         
         <h2 className="Edit-h2">Edit Profile</h2>
        </div>
   
 <div className="email-display">
   
</div>


<div className="preview-container" id="previewContainer">
           <img src={cat} alt="Preview" className="preview-image" id="previewImage" />
          <button type="button" className="remove-photo" > Remove </button>
        </div>

    <div className="form-group">
      <label htmlFor="username" className="EditLabel">New Username</label>
     <input type="text" id="editUsername"  className="edit-username" placeholder="Enter your new username"  value={username}  onChange={handleUsernameChange}/>
      <p
  id="feedback"
  style={{
    textAlign:"center",
    color: usernameColor,
    visibility: username ? "visible" : "hidden"
  }}
>
  {usernameFeedback}
</p>
{/* {error && (
              <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p> )}*/}
      <label htmlFor="EditedEmail" className="EditLabel">New Email</label>
     <input type="email" id="EditedEmail"  className="edit-Email" placeholder="Enter your new email"  value={editEmail}  onChange={(e) => setEditEmail(e.target.value)} />
    
 </div>
 
 <label  htmlFor="profilePic" className="EditLabel">Profile Picture</label>
   
  
     <input type="file" id="profilePic" className="editPfp" accept="image/*" />
                
         
    
    <div className="password-link">
      <a href="#"  className="editPassword" onClick={() => navigate("/reset")}>Change Password </a>
    </div>
           <div className="action-buttons">
             <button type="button"  className="main-btn cancel-btn" onClick={() => navigate("/profile")}>Cancel</button>

                <button type="submit" className="main-btn save-btn" id="saveBtn">
                    Save Changes
                </button>
            </div>
       
    </div>

     </form>
    
</div>

    );
}