import "../styles/RRP.css";
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
import { useEffect } from "react";
import { isValidEmail } from "../assets/components/Validations";
import axios from "axios";


export default function RRP() {
    const navigate = useNavigate();
const [email, setEmail] = useState("");


    
    const [error, setError] = useState("");
    
    // form submit handler*/
   const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!isValidEmail(email)) {
    setError("Email Not Valid");
    return;
  }

  try {
    console.log(email)
    await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
    // always show success message — don't reveal if email exists.......damn
    alert("If that email exists, a reset link has been sent. Check your inbox!");
    navigate("/login");
  } catch (err) {
    console.error("Failed to send reset email:", err);
    setError("Something went wrong. Try again.");
  }
};

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
             {error && (
              <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p> )}
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
