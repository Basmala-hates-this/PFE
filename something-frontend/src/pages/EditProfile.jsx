import "../styles/editProfile.css"
import cat from "../photos/Cat.jpg"
 import { useNavigate } from "react-router-dom";
 import { useEffect } from "react";
 import { useState } from "react";
  import axios from "axios";
  import { useTranslation } from 'react-i18next';

  import {validateUsername, isValidEmail} from "../assets/components/Validations.js";
//the amount of steeling aand fixer upper from other pages is concerning concidering i'm a "programmer"
//if i already have it why re-write ir .....right?
import api from "../api/axios.js";

export default function EditProfile(){
 const navigate = useNavigate();
 const { t } = useTranslation();

  const [username, setUsername] = useState("");
   const [usernameFeedback, setUsernameFeedback] = useState("");
   const [usernameColor, setUsernameColor] = useState("");
   const [editEmail, setEditEmail] = useState("");
   

  //huummm...dynamic pfp updates..but leave the cat as a fallback because i like it
  const [profilePreview, setProfilePreview] = useState(cat); 
const [selectedFile, setSelectedFile] = useState(null);

useEffect(() => {
  // const token = localStorage.getItem("token");
  // axios.get("http://localhost:5000/api/users/me", {
  //   headers: { Authorization: `Bearer ${token}` }
  // }).
  api.get("/users/me").then((res) => {
   
    setUsername(res.data.username);
    setEditEmail(res.data.email);
     console.log("me data:", res.data.profile_pic_url);
    console.log("me full data:", res.data);
    if (res.data.profilePicUrl) {
      setProfilePreview(res.data.profilePicUrl);
    }
  }).catch((err) => {
    console.error("Failed to fetch user:", err);
  });
}, []);


//immidiate preview//however u write that word..the hell is wrong with my typing bruh
// const handleFileChange = (e) => {
//   const file = e.target.files[0];
//   if (!file) return;
//   //ehhh...limits for localstorage//this might not be necessery when databased
// if (file.size > 2 * 1024 * 1024) {
//   alert("Image must be under 2MB");
//   return;
// }
// //also...not sure if this should come here or before...or after...i think here...

//   const reader = new FileReader();
//   reader.onloadend = () => {
//     setProfilePreview(reader.result); // base64 string
//     setSelectedFile(reader.result);
//   };

//   reader.readAsDataURL(file);
// };

//le photot remove handler//i noticed the typo .....but i'm keeping it because i like how it looks tot
const handleRemovePhoto = () => {
  setProfilePreview(cat); 
  setSelectedFile(null);
};

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert(t("editProfile.imageTooLarge"));
    return;
  }
  setSelectedFile(file); // store actual file object
  setProfilePreview(URL.createObjectURL(file)); // preview using object URL
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


//ze backend submit shit....i swear i have slept yestrday but i am extremly tired right now...the hell?
const handleSubmit = async (e) => {
  e.preventDefault();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return;

  const isChangingUsername = username.trim() !== "" && username !== currentUser.username;
  const isChangingEmail = editEmail.trim() !== "" && editEmail !== currentUser.email;
  const isChangingPfp = selectedFile !== null;

  if (!isChangingUsername && !isChangingEmail && !isChangingPfp) {
    alert(t("editProfile.nothingToUpdate"));
    return;
  }

  try {
    const token = localStorage.getItem("token");
    
    // use FormData instead of JSON for file uploads
    const formData = new FormData();
    if (isChangingUsername) formData.append("username", username);
    if (isChangingEmail) formData.append("email", editEmail);
    if (isChangingPfp) formData.append("profilePic", selectedFile);

    // const response = await axios.patch(
    //   "http://localhost:5000/api/users/me",
    //   formData,
    //   { 
    //     headers: { 
    //       Authorization: `Bearer ${token}`,
    //       "Content-Type": "multipart/form-data"
    //     } 
    //   }
    // );
    const response = await api.patch(
  "/users/me",
  formData,
  { headers: { "Content-Type": "multipart/form-data" } }
);

    localStorage.setItem("currentUser", JSON.stringify(response.data));
    window.dispatchEvent(new Event("storage"));

    alert(t("editProfile.updateSuccess"));
    navigate("/dashboard");

  } catch (err) {
    if (err.response?.data?.message) {
      alert(t("editProfile.updateError"));
    } else {
      console.error("Failed to update profile:", err);
    }
  }
};


const PasswordResetLink = () => {
//     const currentUser = JSON.parse(localStorage.getItem("currentUser"));

//   const usernameCheck = prompt("Enter your username to confirm deletion:");

// if (usernameCheck !== currentUser.username) {
//   alert("Incorrect username.");
//   return;
// }
//
  const confirm = window.confirm(t("editProfile.passwordRedirect"));
  if (confirm) navigate("/reset");
};



    return(
<div id="body9"><form id="profileForm" onSubmit={handleSubmit}>
<div className="edit-profile-card">
        <div className="page-title">
         
         <h2 className="Edit-h2">{t("editProfile.pageTitle")}</h2>
        </div>
   
 <div className="email-display">
   
</div>


<div className="preview-container" id="previewContainer">
           <img src={profilePreview} alt="Preview" className="preview-image" id="previewImage" />
          <button type="button" className="remove-photo" onClick={handleRemovePhoto}> Remove </button>
        </div>

    <div className="form-group">
      <label htmlFor="username" className="EditLabel">{t("editProfile.usernameLabel")}</label>
     <input type="text" id="editUsername"  className="edit-username" placeholder={t("editProfile.usernamePlaceholder")}  value={username}  onChange={handleUsernameChange}/>
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
      <label htmlFor="EditedEmail" className="EditLabel">{t("editProfile.emailLabel")}</label>
     <input type="email" id="EditedEmail"  className="edit-Email" placeholder={t("editProfile.emailPlaceholder")}  value={editEmail}  onChange={(e) => setEditEmail(e.target.value)} />
    
 </div>
 
 <label  htmlFor="profilePic" className="EditLabel">{t("editProfile.profilePicLabel")}</label>
   
  
     <input type="file" id="profilePic" className="editPfp" accept="image/*"  onChange={handleFileChange} />
                
         
    
    <div className="password-link">
      <a href="#"  className="editPassword" onClick={PasswordResetLink}>{t("editProfile.changePassword")}</a>
    </div>
           <div className="action-buttons">
             <button type="button"  className="main-btn cancel-btn" onClick={() => navigate("/dashboard")}>{t("editProfile.cancel")}</button>

                <button type="submit" className="main-btn save-btn" id="saveBtn">
                    {t("editProfile.saveChanges")}
                </button>
            </div>
       
    </div>

     </form>
    
</div>

    );
}