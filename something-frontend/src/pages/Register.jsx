import "../styles/register-login.css"
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
 import {validateUsername, checkPasswordStrength} from "../assets/components/Validations.js";
 import { useEffect } from "react";
 import { useRegistration } from "../assets/components/Context.jsx";
 import axios from "axios";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.js';
import FloatingHelper from "../assets/components/Floatinghelper";
import api from "../api/axios.js";
import { useVoiceCommand } from '../assets/hooks/useVoiceCommand.js';
import { VoiceCommandProvider } from '../assets/components/VoiceCommandContext.jsx';
import { useRef } from "react";
import { useGuidedFormFill } from '../assets/hooks/useGuidedFormFill.js';

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


  const [isCheckingUsername, setIsCheckingUsername] = useState(false);


  //leaving a perfectly working page as it is?heck no...
  // add extra shit because why not?heck yea
  // otp shit
  const [otp, setOtp] = useState("");
const [otpVerified, setOtpVerified] = useState(false);
const [otpFeedback, setOtpFeedback] = useState("");
const [otpColor, setOtpColor] = useState("");
const [resendTimer, setResendTimer] = useState(60);
const [canResend, setCanResend] = useState(false);


const [isSubmitting, setIsSubmitting] = useState(false);


const { t, i18n } = useTranslation();
const isRTL = i18n.language === "ar";

//if someine ever was able to skip info form....this will atke them back to it
useEffect(() => {
  if (!profile) {
    navigate("/info");
  }
}, [profile, navigate]);

useVoiceCommand({
  id: 'welcome',
  phrases: ['welcome', 'go to welcome','go to home page','back to home page','back to home'],
  handler: () => navigate('/'),
  label: 'Taking you to home page',
});

//upon me realizing the user name bug...apperantlly it was in my plans but i forgot...of course i did....we will atempt to fix it now....help
const [error, setError] = useState("");

const handleUsernameBlur = async () => {
  if (!username) return;
    setIsCheckingUsername(true);
  try {
 
    const response = await api.get(`/auth/check-username?username=${username}`);
    if (response.data.exists) {
      setError(t("validation.username_already_taken"));
    } else {
      setError("");
    }
  } catch (err) {
    console.error("Username check failed", err);
  }
  finally {
    setIsCheckingUsername(false);
  }
};


const handleSubmit =async (e) => {
  e.preventDefault();
   if (error) return;
  if (!canSubmit) return;
    setIsSubmitting(true);
 try {
 
    await api.post("/auth/verify-otp", { email: profile.email, otp });
setOtpFeedback(t("validation.otp_verified"));
    setOtpColor("green");
    setOtpVerified(true);
  } catch (err) {
setOtpFeedback(err.response?.data?.message || t("validation.otp_invalid"));
    setOtpColor("#fc0c0ce9");
    return; 
  }
  finally {
    setIsSubmitting(false);
  }





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

  const result = validateUsername(value,t);
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

  const result = checkPasswordStrength(value,t);
  setPasswordStrength(result.message);
  setStrengthColor(result.color);
};

// otp
useEffect(() => {
  if (resendTimer === 0) {
    setCanResend(true);
    return;
  }
  const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
  return () => clearTimeout(timer);
}, [resendTimer]);




// resend is nice to have ...right?
const handleResendOtp = async () => {
  if (!canResend) return;
  try {
   
    await api.post("/auth/send-otp", { email: profile.email });
    setCanResend(false);
    setResendTimer(60);
setOtpFeedback(t("validation.otp_resent"));
    setOtpColor("green");
    setOtp("");
    setOtpVerified(false);
  } catch (err) {
setOtpFeedback(t("validation.otp_resent_failed"));
    setOtpColor("#fc0c0ce9");
  }
}; 




// i wanted pretty button when everything is valid....why is this pain?`
useEffect(() => {
  const usernameValid = validateUsername(username,t).valid;
  const passwordsMatch = password && password === confirmPassword;
  const strongEnough = checkPasswordStrength(password,t).strength >= 4;

  setCanSubmit(usernameValid && passwordsMatch && strongEnough && !error && !isCheckingUsername );
}, [username, password, confirmPassword, error, isCheckingUsername]);


const usernameRef = useRef(null);

useVoiceCommand({
  id: 'focus-username',
  phrases: ['fill username', 'enter username', 'type my username', 'go to username', 'focus username'],
  handler: () => usernameRef.current?.focus(),
  label: 'Focused the username field — go ahead and type',
});

const isValidOtp = (value) => /^\d{6}$/.test(value);
const normalizeOtp = (raw) => raw.replace(/\D/g, ''); // strip anything STT adds that isn't a digit (spaces, "dash", stray words)

const otpFields = [
  {
    id: 'otp', label: 'six digit code', setter: (value) => {
      setOtp(value);
      setOtpVerified(false);
      setOtpFeedback("");
    },
    normalize: normalizeOtp, validate: isValidOtp,
  },
];

const { runWalkthrough: fillOtp } = useGuidedFormFill(otpFields);

useVoiceCommand({
  id: 'fill-otp',
  phrases: ['fill the code', 'enter the otp', "what's the code", 'fill otp', 'enter verification code'],
  handler: fillOtp,
  label: 'Starting the code entry',
});

useVoiceCommand({
  id: 'resend-otp',
  phrases: ['resend the code', 'resend otp', 'send me a new code', "i didn't get the code"],
  handler: handleResendOtp,
  label: 'Resending the code',
});

////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

 
  return (
    <div id="body2">


      <FloatingHelper currentPage="register" /> 

      
      <form  id="registerForm" onSubmit={handleSubmit} >
        <fieldset id="field4" >
            <legend  id="logReg">{t("register.legend_main")}</legend>
            <div id="logcenter">



                <label htmlFor="username" id="label"> {t("register.username_label")} </label>
                <br />
                <input type="text" required minLength="5" id="username" className="username" name="username"  
                value={username} placeholder={t("register.username_placeholder")} onChange={handleUsernameChange}
                onBlur={handleUsernameBlur}  ref={usernameRef}  />
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
                <label htmlFor="password" id="label"> {t("register.password_label")} </label>
                <br/>
                <input  type={showPassword ? "text" : "password"} id="password"  minLength="8"  name="password" required value={password} placeholder={t("register.password_placeholder")} onChange={handlePasswordChange}/>
               <p
  id="strength"
  style={{
    color: strengthColor,
    visibility: password ? "visible" : "hidden"
  }}
>
  {passwordStrength}
</p>
<p id="strength"> {t("register.pass")} <br /> {t("register.passreq")}</p>
                <br/><br/>
                <label htmlFor="Cpassword" id="label"> {t("register.confirm_password_label")} </label>
                <br/>
                <input type={showPassword ? "text" : "password"}  id="Cpassword"  minLength="8"  name="Cpassword" placeholder={t("register.confirm_password_placeholder")} required  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}/><br/>
                 <label id="label"> <input type="checkbox" id="togglePassword" onChange={() => setShowPassword(!showPassword)}/>
                <span id="ohhh"> {showPassword ? " 🙈" : " 👀"}</span></label>
                <br/><br/>

{/* i'll add it here and see ...althu i think i'll add it after */}
 <label id="label"> {t("register.otp_label")} </label>
  <br />
  <div >
    <input
      type="text"
      maxLength="6"
      placeholder={t("register.otp_placeholder")}
      value={otp}
      onChange={(e) => {
        setOtp(e.target.value);
        setOtpVerified(false);
        setOtpFeedback("");
      }}
      style={{ width: "30%", letterSpacing: "5px", fontSize: "18px" ,marginLeft:"25px",borderRadius:"8px", padding:"8px 16px",maxHeight:"30px",height:"100%",marginRight:"3%"}}
    /> <br /><br />
  
  </div>

  {otpFeedback && (
    <p style={{ color: otpColor, marginTop: "8px", fontSize: "16px", backgroundColor: otpVerified ? "#d4edda" : "#f8d7da", padding: "10px", borderRadius: "8px", width: "30%", marginLeft: "35%" }}>
      {otpFeedback}
    </p>
  )}

  <p  style={{ color: "#000000", cursor: "pointer", textDecoration: "underline" ,backgroundColor:"#e8e8e8f0", padding:"4px 8px", borderRadius:"8px",width:"30%",marginLeft:"35%"}}>
    {canResend ? (
      <span
        onClick={handleResendOtp}
       
      >
        {t("register.otp_resend_btn")}
      </span>
    ) : (
      `${t("register.otp_resend_timer", { seconds: resendTimer })}`
    )}
  </p>
  <br /><br />

                <input type="submit" value={isSubmitting ? t("register.btn_sending") : t("register.btn_finish")}  disabled={isSubmitting} className="btn2" disabled={!canSubmit}  /> 
                <br />
            
                <br/><br/>
                <a href="#" id="backLink" onClick={() => navigate("/")}> {t("register.link_back_home")} </a>


            </div>
        </fieldset>

    </form>
    <div className="bg2"></div>
    </div>
  );
}