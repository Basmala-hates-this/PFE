import "../styles/register-login.css"
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
//  import {validateUsername} from "../assets/components/Validations.js";
 import { useEffect } from "react";
 import { isValidEmail } from "../assets/components/Validations.js";



export default function Login(){


  //i need to learn to keep the variable declaration AT THE DAMN TOP OF THIS DAMN FUNCTIONS BRO THE HELL!!!
  const [password, setPassword] = useState("");
const [error, setError] = useState("");



  const [username, setUsername] = useState("");
  const [usernameFeedback, setUsernameFeedback] = useState("");
  const [usernameColor, setUsernameColor] = useState("");

  const [showPassword, setShowPassword] = useState(false);


  const navigate = useNavigate();

//huumm...the browser is playing with me and adding data i didint input ....i want it crispy clean soooo.....
useEffect(() => {
  setUsername("");
  setPassword("");
}, []);
///////////////////////////////
const handleSubmit = (e) => {
  e.preventDefault();
  setError("");
//again...localstorage to the testing rescue...we get theusers existing...i for somereason found users and user....but it just reads users....to  be fixed later
  const users = JSON.parse(localStorage.getItem("users")) || JSON.parse(localStorage.getItem("user")) || [];

  //our little tini tiny checker 
  let user = null;
// we look for the username OR email ...if they exist.then check the password related to that accoount
  if (isValidEmail(username)) {
    // email login
    user = users.find((u) => u.email === username);
  } else {
    // username login
    user = users.find((u) => u.username === username);
  }
  // if user not found or password incorrect

  if (!user || user.password !== password) {
    setError("Credentials are incorrect.");
    return;
  }

  alert("Registration Successful!!!!");


  //this sets the current user....i hate this...
localStorage.setItem("currentUser", JSON.stringify(user));



  //le legin est successful...i'll add a star emoji to this comment later...
  navigate("/dashboard");
};





   const handleUsernameChange = (e) => {
  setUsername(e.target.value);
};

const handlePasswordChange = (e) => {
  setPassword(e.target.value);
};




    

  return (
    <div id="body2">
      <form  onSubmit={handleSubmit} id="loginForm" autoComplete="off"> {/*<!--action="dashboard2.1.html"rederect the user to the dashboard after confirming with the database?? --> */}
        <fieldset id="field4">
            <legend id="logReg">Log In To Your Account</legend>
            <div id="logcenter">
            <label htmlFor="username" id="label" >Your Username or Registered Email: </label>
            <br/><br/>
            <input type="text" required id="username" minLength="5" className="username" name="username"  placeholder=" EX: bruh~$&-_" value={username} onChange={handleUsernameChange}/>
   {/* <p
  id="feedback"
  style={{
    color: usernameColor,
    visibility: username ? "visible" : "hidden"
  }}
>
  {usernameFeedback}
</p>     i figured since this passed the register rigex ten no need for live feedback...    */}   
<br/><br/> 
            <label htmlFor="password" id="label"> Your Password:</label>
            <br/><br/>
            <input type={showPassword ? "text" : "password"} id="password"   minLength="8" maxLength="15" name="password" required value={password} onChange={handlePasswordChange}/><br/>
            <label id="label"> <input type="checkbox" id="togglePassword" onClick={() => setShowPassword(!showPassword)} />
                <span id="ohhh"> {showPassword ? " 🙈" : " 👀"}</span></label>
            <br/><br/>
{/* hummm thsi displays the VERY creative error message.... */}
            {error && (
  <p style={{ color: "#fc0c0c", marginTop: "10px" ,fontSize:"20px",backgroundColor:"#d0d1eeba", borderRadius: "12px", width:"40%", marginLeft:"30%"}}>
    {error}
  </p>
)} <br />
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