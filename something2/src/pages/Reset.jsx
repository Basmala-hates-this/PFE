import "../styles/rp.css";
export default function Reset() {
    return (
        <div id="body6">
              <form  action="login.html">
        <fieldset id="field6">
            <h2 id="rpTitle">Reset Your Password 🔒</h2>
            
                <label htmlFor="password" className="rpLabel" >Choose Your New Password:</label>
                <br/>
                <input type="password" id="RPpassword" className="password" minLength="8" maxLength="15" name="password" required/>
                <br/><br/>
                <label htmlFor="Cpassword" className="rpLabel">Confirm Password:</label>
                <br/>
                <input type="password"  id="RPCpassword" className="Cpassword" minLength="8" maxLength="15" name="Cpassword" required/>
                <br/>
                 <label id="label" className="rpLabel"> <input type="checkbox" className="rpCheck" id="togglePassword"/>
                <span id="ohhh"> 👀</span></label>
                <br/><br/>
                <input type="submit" value="Change Password" className="btn6" /> 
                <br/><br/>
                

        </fieldset>

       </form>
        </div>
    );
}