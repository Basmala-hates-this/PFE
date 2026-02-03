import "../styles/register-login.css"
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
 import {validateUsername} from "../assets/components/Validations.js";
 import { useEffect } from "react";


export default function Login(){
const handleSubmit = (e) => {
  e.preventDefault();

  if (!canSubmit) return;

  // TEMP: final navigation (later we merge with Info)
  navigate("/dashboard");
};


  const [username, setUsername] = useState("");
  const [usernameFeedback, setUsernameFeedback] = useState("");
  const [usernameColor, setUsernameColor] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);


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


const handlePasswordChange = (e) => {
  const value = e.target.value;
  setPassword(value);

  
  if (value.length === 0) {
    setPasswordStrength("");
    setStrengthColor("");
    return;
  }

  const result = checkPasswordStrength(value);
  setPasswordStrength(result.message);
  setStrengthColor(result.color);
};

    const navigate = useNavigate();

  return (
    <div id="body2">
      <form  onSubmit={handleSubmit} id="loginForm"> {/*<!--action="dashboard2.1.html"rederect the user to the dashboard after confirming with the database?? --> */}
        <fieldset id="field4">
            <legend id="logReg">Log In To Your Account</legend>
            <div id="logcenter">
            <label htmlFor="username" id="label" >Your Username or Registered Email: </label>
            <br/><br/>
            <input type="text" required id="username" minLength="5" className="username" name="username" maxLength="20" placeholder=" EX: bruh~$&-_" value={username} onChange={handleUsernameChange}/>
   <p
  id="feedback"
  style={{
    color: usernameColor,
    visibility: username ? "visible" : "hidden"
  }}
>
  {usernameFeedback}
</p>            <br/><br/>
            <label htmlFor="password" id="label"> Your Password:</label>
            <br/><br/>
            <input type={showPassword ? "text" : "password"} id="password"   minLength="8" maxLength="15" name="password" required vvalue={password} onChange={handlePasswordChange}/><br/>
            <label id="label"> <input type="checkbox" id="togglePassword" onClick={() => setShowPassword(!showPassword)} />
                <span id="ohhh"> {showPassword ? " 🙈" : " 👀"}</span></label>
            <br/><br/>
                <input type="submit" value="login" className="btn2" /> 
                <br/><br/>
                <a href="#" id="rrpLink" onClick={() => navigate("/rrp")}>Forgot Your Password?</a>
                <br/><br/>
                
                 <a href="#" id="backLink" >Back to Home</a>
            </div>


        </fieldset>

    </form>
    <div className="bg2"></div>
    </div>
  );
}