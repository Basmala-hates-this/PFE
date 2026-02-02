import "../styles/register-login.css"
 import { useNavigate } from "react-router-dom";


export default function Login(){
    const navigate = useNavigate();

  return (
    <div id="body2">
      <form  method="post" id="loginForm"> {/*<!--action="dashboard2.1.html"rederect the user to the dashboard after confirming with the database?? --> */}
        <fieldset id="field4">
            <legend id="logReg">Log In To Your Account</legend>
            <div id="logcenter">
            <label htmlFor="username" id="label" >Your Username or Registered Email: </label>
            <br/><br/>
            <input type="text" required id="username" minLength="5" className="username" name="username" maxLength="20" placeholder=" EX: bruh~@$&-_" />
            <p id="feedback"></p>
            <br/><br/>
            <label htmlFor="password" id="label"> Your Password:</label>
            <br/><br/>
            <input type="password" id="password"   minLength="8" maxLength="15" name="password" required /><br/>
            <label id="label"> <input type="checkbox" id="togglePassword" />
                <span id="ohhh"> 👀</span></label>
            <br/><br/>
                <input type="submit" value="login" className="btn2" /> 
                <br/><br/>
                <a href="#" id="rrpLink" onClick={() => navigate("/rrp")}>Forgot Your Password?</a>
                <br/><br/>
                
                 <a href="#" id="backLink" onClick={() => navigate("/")}>Back to Home</a>
            </div>


        </fieldset>

    </form>
    <div className="bg2"></div>
    </div>
  );
}