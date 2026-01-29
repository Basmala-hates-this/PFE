import "../styles/rp.css";
export default function Reset() {
    return (
        <div id="body6">
              <form  action="login.html">
        <fieldset id="field6">
            <h2 id="rpTitle">Reset Your Password 🔒</h2>
            
                <label htmlFor="password" className="rpLabel" >Choose Your New Password:</label>
                <br/>
                <input type="password" id="password" className="password" minLength="8" maxLength="15" name="password" required/>
                <br/><br/>
                <label htmlFor="Cpassword" className="rpLabel">Confirm Password:</label>
                <br/>
                <input type="password"  id="Cpassword" className="Cpassword" minLength="8" maxLength="15" name="Cpassword" required/>
                <br/>
                 <label id="label" className="rpLabel"> <input type="checkbox" id="togglePassword"/>
                <span id="ohhh"> 👀</span></label>
                <br/><br/>
                <input type="submit" value="Change Password" className="btn6" /> 
                <br/><br/>
                

        </fieldset>

       </form>
        </div>
    );
}