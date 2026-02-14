//me need to cenect this page to the previous selected/found accout so we can update the said password....
//otherwise...who on earth would this change the password to?
//i feel like progress-webtu's  random password changes has something to do with this....eitherway...lets see how bad we can make this



import "../styles/rp.css";
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";

  import { checkPasswordStrength} from "../assets/components/Validations.js";
 import { useEffect } from "react";
 import { useRegistration } from "../assets/components/Context.jsx";

export default function Reset() {
      const navigate = useNavigate();
       
      
//the irony of me using react was to not rewrite alot of things....but i really cant help but have costum functions for each elemnt
//welp...having the standards ones away and just calling them when needed is also kinda nice....right?

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [strengthColor, setStrengthColor] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  //i'm too sick and tired this is going to be extra hell...either way...for selecting and changing the password of the correct account
  //email found:
const resetEmail = localStorage.getItem("resetEmail");
const currentUser = JSON.parse(localStorage.getItem("currentUser"));//eehhhh....recycling and using this same page in the damn password change for editProfile page...

// determine who we are resetting
const targetEmail = resetEmail || currentUser?.email;
  //as much as i hate this security...i need it 
  //but is login the correct page here?welp couldnt care less each page has links to navigate......
  useEffect(() => {
  if (!targetEmail) {
    navigate("/login");
  }
}, []);


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

  ///ternary operators are my goated if/else statments....same as template literal for messages...
  //we update THE SELECTED USER RATHER THAN ANYOTHER 
    const users = JSON.parse(localStorage.getItem("users")) || JSON.parse(localStorage.getItem("user")) || [];

  const updatedUsers = users.map(user =>
    user.email === targetEmail
      ? { ...user, password }
      : user
  );
//...this should also update context so it is easy to backend it later-if that is a word- meh another shit for another day
//reminder to my forgetful sole...and urs partner...if u ever ended up reading my comments...
// If it must survive refresh -> storage
// If many components need it -> context
// If it’s temporary & sensitive -> storage, not context
// If it’s UI convenience -> context
//i still do sometimes question my sanety for keeping with this major
  localStorage.setItem("users", JSON.stringify(updatedUsers));
  localStorage.removeItem("resetEmail");
//self explanatory...or should i explaun to ur dull forgetfull brain?we use the page for 2 diffrent sides of the system...if else to define each side of the damn thing
//also i would like to apologize now for the awfull typos because that state of brain where i used to mix up lettsrs or write full words backwards is back...fun...
  if (currentUser) {
  alert("Password updated successfully!");
  navigate("/profile");
} else {
  alert("Password successfully reset! Try not to forget this one :)");
  navigate("/login");
}
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