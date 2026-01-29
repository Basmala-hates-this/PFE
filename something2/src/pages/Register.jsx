import "../styles/register-login.css"

export default function Register(){
  return (
    <div id="body2">
      <form  id="registerForm">
        <fieldset id="field4">
            <legend >Create Your Account</legend>
            <div id="logcenter">
                <label for="username" > Choose Your Username: </label>
                <br />
                <input type="text" required minlength="5" id="username" className="username" name="username" maxlength="20"/>
                <p id="feedback"></p>

                <br/><br/>
                <label htmlFor="password" >Choose Your Password:</label>
                <br/>
                <input type="password" id="password"  minlength="8" maxlength="15" name="password" required/>
                <p id="strength"></p>
                <br/><br/>
                <label htmlFor="Cpassword" >Confirm Password:</label>
                <br/>
                <input type="password"  id="Cpassword"  minlength="8" maxlength="15" name="Cpassword" required/><br/>
                 <label id="label"> <input type="checkbox" id="togglePassword"/>
                <span id="ohhh"> 👀</span></label>
                <br/><br/>
                <input type="submit" value="finish" className="btn2" /> 
                <br/><br/>
                <a href="welcome.html">Back to Home</a>


            </div>
        </fieldset>

    </form>
    <div class="bg2"></div>
    </div>
  );
}