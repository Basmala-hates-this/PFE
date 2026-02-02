import "../styles/RRP.css";
 import { useNavigate } from "react-router-dom";

export default function RRP() {
    const navigate = useNavigate();

  return (
    <div className="RRP" id="body4">  
        <form action="resetPassword.html" method="post" id="reset-form">
        <fieldset id="field5">
            <h2> Request To Reset Your Password 🔒</h2>
            <br/><br/>
            <label htmlFor="reset-email" className="email">Enter Your Registered Email:</label>
            <br/>
            <input type="email" id="reset-email" name="reset-email" placeholder="something@something.something" required />
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
