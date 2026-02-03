import "../styles/register-login.css"
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
 import {validateUsername, checkPasswordStrength} from "../assets/components/Validations.js";
 import { useEffect } from "react";


export default function Register(){


const handleSubmit = (e) => {
  e.preventDefault();

  if (!canSubmit) return;

  // TEMP: final navigation (later we merge with Info)
  navigate("/fin");
};



    const navigate = useNavigate();

    
  const [username, setUsername] = useState("");
  const [usernameFeedback, setUsernameFeedback] = useState("");
  const [usernameColor, setUsernameColor] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [strengthColor, setStrengthColor] = useState("");

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
// i wanted pretty button when everything is valid....why is this pain?
useEffect(() => {
  const usernameValid = validateUsername(username).valid;
  const passwordsMatch = password && password === confirmPassword;
  const strongEnough = checkPasswordStrength(password).strength >= 4;

  setCanSubmit(usernameValid && passwordsMatch && strongEnough);
}, [username, password, confirmPassword]);

  return (
    <div id="body2">
      <form  id="registerForm" onSubmit={handleSubmit} >
        <fieldset id="field4" >
            <legend  id="logReg">Create Your Account</legend>
            <div id="logcenter">
                <label htmlFor="username" id="label"> Choose Your Username: </label>
                <br />
                <input type="text" required minLength="5" id="username" className="username" name="username" maxLength="20" value={username} onChange={handleUsernameChange}/>
               <p
  id="feedback"
  style={{
    color: usernameColor,
    visibility: username ? "visible" : "hidden"
  }}
>
  {usernameFeedback}
</p>

                <br/><br/>
                <label htmlFor="password" id="label">Choose Your Password:</label>
                <br/>
                <input  type={showPassword ? "text" : "password"} id="password"  minLength="8" maxLength="15" name="password" required value={password} onChange={handlePasswordChange}/>
               <p
  id="strength"
  style={{
    color: strengthColor,
    visibility: password ? "visible" : "hidden"
  }}
>
  {passwordStrength}
</p>
                <br/><br/>
                <label htmlFor="Cpassword" id="label">Confirm Password:</label>
                <br/>
                <input type={showPassword ? "text" : "password"}  id="Cpassword"  minLength="8" maxLength="15" name="Cpassword" required  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}/><br/>
                 <label id="label"> <input type="checkbox" id="togglePassword" onChange={() => setShowPassword(!showPassword)}/>
                <span id="ohhh"> {showPassword ? " 🙈" : " 👀"}</span></label>
                <br/><br/>
                <input type="submit" value="finish" className="btn2" disabled={!canSubmit}  /> 
                <br/><br/>
                <a href="#" id="backLink" onClick={() => navigate("/")}>Back to Home</a>


            </div>
        </fieldset>

    </form>
    <div className="bg2"></div>
    </div>
  );
}