import "../styles/RRP.css";
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
import { useEffect } from "react";
import { isValidEmail } from "../assets/components/Validations";

export default function RRP() {
    const navigate = useNavigate();
const [email, setEmail] = useState("");


    
    const [error, setError] = useState("");
    
    // form submit handler*/
    const handleSubmit = (e) => {
      
      e.preventDefault();
      const users = JSON.parse(localStorage.getItem("users"))  || [];
    
    const emailExists = users.some(
      (u) => u.email === email
    );

    if(!isValidEmail(email)){
  alert("Email Not Valid");
  return;
}
  
else if (!emailExists) {
  setError("Email Does Not Exist... You Have the Right Email?");
  alert("Email Does Not Exist...Do You Have the Right Email?");
  return;
}
//2 parts of the party are  working...check if the email is valid then check if it exists...
//the third one is not for the moment....why is giving an existing email flagg the second alert?
//damn...my guess is i'm not checking the localstorage corectly.....
//again it ws my logic which i had to invert the emailexist part....
//eitherway....for real flow...we will keep the email we found....so we can use it to change the password of the said email's related account
//pointless work.....NOT POINTLESS WHATSOEVER
localStorage.setItem("resetEmail", email);


  navigate("/Reset");


  
  }

  return (
    <div className="RRP" id="body4">  
        <form onSubmit={handleSubmit} method="post" id="reset-form">
        <fieldset id="field5">
            <h2> Request To Reset Your Password 🔒</h2>
            <br/><br/>
            <label htmlFor="reset-email" className="email">Enter Your Registered Email:</label>
            <br/>
            <input type="email" id="reset-email" name="reset-email" placeholder="something@something.something" required  value={email} onChange={(e) => setEmail(e.target.value)} />
            <br />
             {/* {error && (
              <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p> )}*/}
            <br/><br/>
            <button type="submit" id="btn4">Send Reset Link</button>
            <br/><br/>
            <div id="forgotlinks">
               <a href="#" id="backLog" onClick={() => navigate("/login")}>Back To Login </a>
               <br/><br/>
                <a href="#" id="backHome" onClick={() => navigate("/")}>Back To Home</a>
           </div>
        </fieldset>
        
    </form>
    </div>
  );
}
