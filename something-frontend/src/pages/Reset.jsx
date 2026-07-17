//me need to cenect this page to the previous selected/found accout so we can update the said password....
//otherwise...who on earth would this change the password to?
//i feel like progress-webtu's  random password changes has something to do with this....eitherway...lets see how bad we can make this



import "../styles/rp.css";
import { useNavigate, useSearchParams } from "react-router-dom"; import { useState } from "react";

  import { checkPasswordStrength} from "../assets/components/Validations.js";
 import { useEffect } from "react";
 import { useRegistration } from "../assets/components/Context.jsx";

 import axios from "axios";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.js';
import api from "../api/axios.js";

export default function Reset() {
      const navigate = useNavigate();
      const { t } = useTranslation();

      const [searchParams] = useSearchParams();
      const token = searchParams.get("token");
       
      
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
  // const authToken = localStorage.getItem("token");
  if (!token && !currentUser) {
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

  const result = checkPasswordStrength(value,t);
  setPasswordStrength(result.message);
  setStrengthColor(result.color);
};

useEffect(() => {
  
  const passwordsMatch = password && password === confirmPassword;
  const strongEnough = checkPasswordStrength(password,t).strength >= 4;

 

  setCanSubmit( passwordsMatch && strongEnough);
}, [ password, confirmPassword]);

//wait...does register have the same set of error handlers?...meh i'll check later
const handleSubmit = async (e) => {
  e.preventDefault();

  const passwordsMatch = password === confirmPassword;
  const strongEnough = checkPasswordStrength(password).strength >= 4;

  if (!passwordsMatch) {
    alert(t("reset.passwords_no_match"));
    return;
  }

  if (!strongEnough) {
    alert(t("reset.password_weak"));
    return;
  }

  ///ternary operators are my goated if/else statments....same as template literal for messages...
  //we update THE SELECTED USER RATHER THAN ANYOTHER 
   
//...this should also update context so it is easy to backend it later-if that is a word- meh another shit for another day
//reminder to my forgetful sole...and urs partner...if u ever ended up reading my comments...
// If it must survive refresh -> storage
// If many components need it -> context
// If it’s temporary & sensitive -> storage, not context
// If it’s UI convenience -> context
//i still do sometimes question my sanety for keeping with this major
 
//self explanatory...or should i explaun to ur dull forgetfull brain?we use the page for 2 diffrent sides of the system...if else to define each side of the damn thing
//also i would like to apologize now for the awfull typos because that state of brain where i used to mix up lettsrs or write full words backwards is back...fun...
if (token) {
    // case 1: email recovery
    try {
      
        await api.post("/auth/reset-password", { token, newPassword: password });
        alert(t("reset.success_recovery"));
        navigate("/login");
    } catch (err) {
        const msg = err.response?.data?.message || t("reset.error");
        alert(msg);
    }
} else {
    // case 2: logged in user changing password
    try {
   

await api.post("/auth/reset-password-auth", { newPassword: password });
        alert(t("reset.success_update"));
        navigate("/profile");
    } catch (err) {
       const msg = err.response?.data?.message || t("reset.error");
        alert(msg);
    }
}
};
const currentLang = i18n.language;
const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};
const handleSelectChange = (event) => {
    // Grabs the value ('en', 'fr', or 'ar') from the chosen option
    changeLanguage(event.target.value);
  };



    return (
        <div id="body6">
            <div className="language-switcher">
      <label htmlFor="lang-select" className="sr-only">Choose Language: </label>
      <select 
        id="lang-select"
        value={currentLang} // Keeps the dropdown synced with your active language
        onChange={handleSelectChange}
        className="lang-dropdown"
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="ar">العربية</option>
      </select>
    </div>
              <form  onSubmit={handleSubmit}>
        <fieldset id="field6">
            <h2 id="rpTitle">{t("reset.title")} 🔒</h2>
            
                <label htmlFor="password" className="rpLabel" >{t("reset.new_password_label")}</label>
                <br/>
                <input type={showPassword ? "text" : "password"} value={password} onChange={handlePasswordChange} id="RPpassword" className="password"  placeholder={t("reset.password_placeholder")} minLength="8"  name="password" required/>
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
                <label htmlFor="Cpassword" className="rpLabel">{t("reset.confirm_password_label")}</label>
                <br/>
                <input type={showPassword ? "text" : "password"}  value={confirmPassword}  onChange={(e) => setConfirmPassword(e.target.value)} id="RPCpassword" placeholder={t("reset.password_placeholder")} className="Cpassword" minLength="8" maxLength="15" name="Cpassword" required/>
                <br/>
                 <label id="label" className="rpLabel"> <input type="checkbox" onChange={() => setShowPassword(!showPassword)} className="rpCheck" id="togglePassword"/>
                <span id="ohhh"> {showPassword ? " 🙈" : " 👀"}</span></label>
                <br/><br/>
                <input type="submit" value={t("reset.submit")} className="btn6" disabled={!canSubmit} /> {/*<!-- after changing password redirect to login page --> */}
                <br/><br/>
                

        </fieldset>

       </form>
        </div>
    );
}