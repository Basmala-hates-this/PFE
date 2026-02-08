import "../styles/rp.css";
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";

  import { checkPasswordStrength} from "../assets/components/Validations.js";
 import { useEffect } from "react";
 import { useRegistration } from "../assets/components/Context.jsx";

export default function Reset() {
      const navigate = useNavigate();
       const { profile, setCredentials } = useRegistration();
      
//the irony of me using react was to not rewrite alot of things....but i really cant help but have costum functions for each elemnt
//welp...having the standards ones away and just calling them when needed is also kinda nice....right?

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [strengthColor, setStrengthColor] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

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

useEffect(() => {
  
  const passwordsMatch = password && password === confirmPassword;
  const strongEnough = checkPasswordStrength(password).strength >= 4;

 

  setCanSubmit( passwordsMatch && strongEnough);
}, [ password, confirmPassword]);

//wait...does register have the same set of error handlers?...meh i'll check later
const handleSubmit = (e) => {
  e.preventDefault();

  const passwordsMatch = password === confirmPassword;
  const strongEnough = checkPasswordStrength(password).strength >= 4;

  if (!passwordsMatch) {
    alert("Passwords do NOT match");
    return;
  }

  if (!strongEnough) {
    alert("Password is not strong enough");
    return;
  }

  setCredentials({ password });
  navigate("/login");
};



    return (
        <div id="body6">
              <form  onSubmit={handleSubmit}>
        <fieldset id="field6">
            <h2 id="rpTitle">Reset Your Password 🔒</h2>
            
                <label htmlFor="password" className="rpLabel" >Choose Your New Password:</label>
                <br/>
                <input type={showPassword ? "text" : "password"} value={password} onChange={handlePasswordChange} id="RPpassword" className="password"  placeholder="Password1*" minLength="8" maxLength="15" name="password" required/>
                <br />
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
                <label htmlFor="Cpassword" className="rpLabel">Confirm Password:</label>
                <br/>
                <input type={showPassword ? "text" : "password"}  value={confirmPassword}  onChange={(e) => setConfirmPassword(e.target.value)} id="RPCpassword" placeholder="Password1*" className="Cpassword" minLength="8" maxLength="15" name="Cpassword" required/>
                <br/>
                 <label id="label" className="rpLabel"> <input type="checkbox" onChange={() => setShowPassword(!showPassword)} className="rpCheck" id="togglePassword"/>
                <span id="ohhh"> {showPassword ? " 🙈" : " 👀"}</span></label>
                <br/><br/>
                <input type="submit" value="Change Password" className="btn6"  /> {/*<!-- after changing password redirect to login page --> */}
                <br/><br/>
                

        </fieldset>

       </form>
        </div>
    );
}