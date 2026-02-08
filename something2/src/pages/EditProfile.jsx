import "../styles/editProfile.css"
import cat from "../photos/Cat.jpg"
 import { useNavigate } from "react-router-dom";
 import { useEffect } from "react";

export default function EditProfile(){
 const navigate = useNavigate();


    return(
<div id="body9"><form id="profileForm">
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
     <input type="text" id="editUsername"  className="edit-username" placeholder="Enter your new username" />
      <label htmlFor="EditedEmail" className="EditLabel">New Email</label>
     <input type="text" id="EditedEmail"  className="edit-Email" placeholder="Enter your new email" />
 </div>
 
 <label  htmlFor="profilePic" className="EditLabel">Profile Picture</label>
   
  
     <input type="file" id="profilePic" className="editPfp" accept="image/*" />
                
         
    
    <div className="password-link">
      <a href="#"  className="editPassword" onClick={() => navigate("/reset")}>Change Password </a>
    </div>
           <div className="action-buttons">
             <a href="#" className="main-btn cancel-btn" onClick={() => navigate("/profile")}>Cancel</a>
                <button type="button" className="main-btn save-btn" id="saveBtn">
                    Save Changes
                </button>
            </div>
       
    </div>

     </form>
    
</div>

    );
}