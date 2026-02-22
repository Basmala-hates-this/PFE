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
   

  //huummm...dynamic pfp updates..but leave the cat as a fallback because i like it
  const [profilePreview, setProfilePreview] = useState(cat); 
const [selectedFile, setSelectedFile] = useState(null);


useEffect(() => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser) {
    setUsername(currentUser.username);
    setEditEmail(currentUser.email);
    if (currentUser.profilePic) {
      setProfilePreview(currentUser.profilePic);
    }
  }
}, []);


//immidiate preview//however u write that word..the hell is wrong with my typing bruh
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  //ehhh...limits for localstorage//this might not be necessery when databased
if (file.size > 2 * 1024 * 1024) {
  alert("Image must be under 2MB");
  return;
}
//also...not sure if this should come here or before...or after...i think here...

  const reader = new FileReader();
  reader.onloadend = () => {
    setProfilePreview(reader.result); // base64 string
    setSelectedFile(reader.result);
  };

  reader.readAsDataURL(file);
};

//le photot remove handler//i noticed the typo .....but i'm keeping it because i like how it looks tot
const handleRemovePhoto = () => {
  setProfilePreview(cat); 
  setSelectedFile(null);
};


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
    alert("No active user found.");//sign in bro...
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

    const isChangingPfp =
  selectedFile !== null ||
  (profilePreview === cat && currentUser.profilePic);


  // If nothing changed
  if (!isChangingUsername && !isChangingEmail && !isChangingPfp) {
    alert("Nothing to update....u discovering?");
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


  

  // Update current user+pfp updates baby...i need to call this in the dashboard and profile
 const updatedUser = {
  ...currentUser,
  username: isChangingUsername ? username : currentUser.username,
  email: isChangingEmail ? editEmail : currentUser.email,
  profilePic: selectedFile !== null
    ? selectedFile
    : profilePreview === cat
      ? null
      : currentUser.profilePic
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
//react will listen to this damn thing changing the localstorage and "live update" the data....might as well test that out.
//am i stupid....i really  might be....i'm using damn react...
//navigating away will push to rerender and reread the data...thus i dont need the damn thing...but if u want to change the user name then change it back...
//which maybe...people like me would do(change to something then back to the original imediatly)....this might be usefull....nah its not but i'm not removig it ..atleast for now


  alert("Profile updated successfully!");
  navigate("/profile");
};
const PasswordResetLink = () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const usernameCheck = prompt("Enter your username to confirm deletion:");

if (usernameCheck !== currentUser.username) {
  alert("Incorrect username.");
  return;
}
  navigate("/reset");
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
           <img src={profilePreview} alt="Preview" className="preview-image" id="previewImage" />
          <button type="button" className="remove-photo" onClick={handleRemovePhoto}> Remove </button>
        </div>

    <div className="form-group">
      <label htmlFor="username" className="EditLabel">New Username</label>
     <input type="text" id="editUsername"  className="edit-username" placeholder="Enter your new username"  value={username}  onChange={handleUsernameChange}/>
     {usernameFeedback && <p
  id="feedback"
  style={{
    textAlign:"center",
    color: usernameColor,
    visibility: username ? "visible" : "hidden"
  }}
>
  {usernameFeedback}
</p>}
{/* {error && (
              <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p> )}*/}
      <label htmlFor="EditedEmail" className="EditLabel">New Email</label>
     <input type="email" id="EditedEmail"  className="edit-Email" placeholder="Enter your new email"  value={editEmail}  onChange={(e) => setEditEmail(e.target.value)} />
    
 </div>
 
 <label  htmlFor="profilePic" className="EditLabel">Profile Picture</label>
   
  
     <input type="file" id="profilePic" className="editPfp" accept="image/*"  onChange={handleFileChange} />
                
         
    
    <div className="password-link">
      <a href="#"  className="editPassword" onClick={PasswordResetLink}>Change Password </a>
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