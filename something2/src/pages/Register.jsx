import "../styles/register-login.css"
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
 import {validateUsername, checkPasswordStrength} from "../assets/components/Validations.js";
 import { useEffect } from "react";
 import { useRegistration } from "../assets/components/Context.jsx";
 import axios from "axios";

//////THE DAMN USERNAME CANNOT BELONG TO ANOTHER USER...IF IT EXISTS ALREADY IT CANNOT BE CHOSEN....fuck...

export default function Register(){

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

  //theh call for infos from the info context to be updated in this ass of a form.....sorry sarah..i hate what i made...
  const { profile, setCredentials } = useRegistration();


//if someine ever was abale to skip info form....this will atke them back to it
useEffect(() => {
  if (!profile) {
    navigate("/info");
  }
}, [profile, navigate]);

//upon me realizing the user name bug...apperantlly it was in my plans but i forgot...of course i did....we will atempt to fix it now....help
const [error, setError] = useState("");

const handleUsernameBlur = async () => {
  if (!username) return;
  try {
    const response = await axios.get(
      `http://localhost:5000/api/auth/check-username?username=${username}`
    );
    if (response.data.exists) {
      setError("Username already taken...be more creative?");
    } else {
      setError("");
    }
  } catch (err) {
    console.error("Username check failed", err);
  }
};


const handleSubmit = (e) => {
  e.preventDefault();
   if (error) return;
  if (!canSubmit) return;






  setCredentials({
    username,
    password
  });

  navigate("/fin");
};




  


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

  setCanSubmit(usernameValid && passwordsMatch && strongEnough && !error);
}, [username, password, confirmPassword, error]);


  return (
    <div id="body2">
      <form  id="registerForm" onSubmit={handleSubmit} >
        <fieldset id="field4" >
            <legend  id="logReg">Create Your Account</legend>
            <div id="logcenter">
                <label htmlFor="username" id="label"> Choose Your Username: </label>
                <br />
                <input type="text" required minLength="5" id="username" className="username" name="username"  
                value={username} placeholder="bruh~$&-_" onChange={handleUsernameChange}
                onBlur={handleUsernameBlur}/>
               <p
  id="feedback"
  style={{
    color: usernameColor,
    visibility: username && !error ? "visible" : "hidden"
  }}
>
  {usernameFeedback}
</p>
    {error && (
  <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p>
)}


                <br/><br/>
                <label htmlFor="password" id="label">Choose Your Password:</label>
                <br/>
                <input  type={showPassword ? "text" : "password"} id="password"  minLength="8"  name="password" required value={password} placeholder="Password1*" onChange={handlePasswordChange}/>
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
                <input type={showPassword ? "text" : "password"}  id="Cpassword"  minLength="8" maxLength="15" name="Cpassword" placeholder="Password1*" required  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}/><br/>
                 <label id="label"> <input type="checkbox" id="togglePassword" onChange={() => setShowPassword(!showPassword)}/>
                <span id="ohhh"> {showPassword ? " 🙈" : " 👀"}</span></label>
                <br/><br/>
                <input type="submit" value="finish" className="btn2" disabled={!canSubmit}  /> 
                <br />
            
                <br/><br/>
                <a href="#" id="backLink" onClick={() => navigate("/")}>Back to Home</a>


            </div>
        </fieldset>

    </form>
    <div className="bg2"></div>
    </div>
  );
}