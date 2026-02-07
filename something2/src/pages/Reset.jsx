import "../styles/rp.css";
 import { useNavigate } from "react-router-dom";

export default function Reset() {
      const navigate = useNavigate();

    return (
        <div id="body6">
              <form  action="login.html">
        <fieldset id="field6">
            <h2 id="rpTitle">Reset Your Password 🔒</h2>
            
                <label htmlFor="password" className="rpLabel" >Choose Your New Password:</label>
                <br/>
                <input type="password" id="RPpassword" className="password"  placeholder="Password1*" minLength="8" maxLength="15" name="password" required/>
                <br/><br/>
                <label htmlFor="Cpassword" className="rpLabel">Confirm Password:</label>
                <br/>
                <input type="password"  id="RPCpassword" placeholder="Password1*" className="Cpassword" minLength="8" maxLength="15" name="Cpassword" required/>
                <br/>
                 <label id="label" className="rpLabel"> <input type="checkbox" className="rpCheck" id="togglePassword"/>
                <span id="ohhh"> 👀</span></label>
                <br/><br/>
                <input type="submit" value="Change Password" className="btn6"  onClick={() => navigate("/login")}/> {/*<!-- after changing password redirect to login page --> */}
                <br/><br/>
                

        </fieldset>

       </form>
        </div>
    );
}