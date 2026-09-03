import "../styles/fin.css"
// import "../scripts/confetti.js"
import axios from "axios";
 import { useNavigate } from "react-router-dom";

import confetti from "canvas-confetti";
 import { useEffect, useState } from "react";

import { useRegistration } from "../assets/components/Context.jsx";
import {
  validateProfile,
  validateUsername,
  checkPasswordStrength
} from "../assets/components/Validations.js";

import { useTranslation } from 'react-i18next';
import api from "../api/axios.js";

import FloatingHelper from "../assets/components/Floatinghelper";
import { useVoiceCommand } from '../assets/hooks/useVoiceCommand.js';

//just noting that my brain thinks this page should have and be able to read the profile for somereason....maybe the username display for dashboard later?
//meh, i'll see later..if not, no big deal.....i hope...
//also....abut the validations of existing profile...i cant see how anyone would reach here without filling the previos 2 forms
//but better safe than sorry i guess?...dmn it..i should have gone with something simpler like a university planner or something...

export default function Fin() {
    const navigate = useNavigate();
    const { profile, credentials } = useRegistration();
    const newUser = { ...profile, ...credentials };

    const [loading, setLoading] = useState(true);

    
  const handleConfetti = () => {
    confetti({
      particleCount: 1100,
      spread: 200,
      origin: { y: 0.7 }
    });
  };

  const { t } = useTranslation();


  //AAAAAAAAAAAAAAAAAA
  //user efect will check the previosly mentiond...if one is false..rederect to he page needed...if not....well....CONTENT!!
 useEffect(() => {
  handleConfetti();
  //no skipping to fin somehow..... YOUUUUUUUUUUUU SHALL NOOOOOOOOOOT PAASSSSSSSSS...said dambeldore quitly....this should cause ragbait to whoever read it:)
  if (!profile || !credentials) {
    navigate("/info");
    return;
  }

  const profileCheck = validateProfile(profile,t);
  if (!profileCheck.valid) {
    navigate("/info");
    return;
  }
//if somehow passed with not so valid data.....am i paranoid ?
  if (
    !validateUsername(credentials.username,t).valid ||
    checkPasswordStrength(credentials.password,t).strength < 4
  ) {
    navigate("/register");
    return;
  }


//this one i belive is extra and is causing problems...i cause myself problems...
//anyhow at register..even if the username is new..it gets flagged as already exists and redirect to register then fin again....weird...
  // if (usernameExists) {
  //   alert("Username already taken.");
  //   navigate("/register");
  //   return;
  // }

  
   const registerUser = async () => {
  try {
    // build FormData instead of sending plain JSON
    const formData = new FormData();
    formData.append("fullName", newUser.fullName);
    formData.append("birthDate", newUser.birthDate);
    formData.append("email", newUser.email);
    formData.append("university", JSON.stringify(newUser.university)); // object → string
    formData.append("role", newUser.role);
    formData.append("majors", JSON.stringify(newUser.majors)); // array → string
    formData.append("username", newUser.username);
    formData.append("password", newUser.password);

    // only append file if professor uploaded one
    if (newUser.profProof) {
      formData.append("proofFile", newUser.profProof);
    }

 
    const response = await api.post(
  "/auth/register",
  formData,
  { headers: { "Content-Type": "multipart/form-data" } }
);

    const data = response.data;
    localStorage.setItem("currentUser", JSON.stringify(data.user));
    setLoading(false);

  } catch (err) {
    console.error("Error sending profile:", err);
    navigate("/register");
  }
};
  registerUser();

 
}, []);



//hol'up imma try something stupid.....that thing was in fact....very stupid.....fixed
//for some reason...when i navigate to dashboard...it saves to users in localstorage-->this later works normally in login
//when i navigate to another link..it goes to user...and at login it does not pass
//i'll change everything to users and see if it works....
//ooh the old sad days of local storage testing.....oh how far have we gone....
const handleDashboard = () => {
  if (loading) return;
    navigate("/dashboard");

};

const handleLogin = () => {
  if (loading) return;
    navigate("/login");

};

const handleWelcome = () => {
  if (loading) return;
    navigate("/");

};


useVoiceCommand({
  id: 'go-dashboard',
  phrases: ['go to dashboard', 'dashboard', 'take me to my dashboard'],
  handler: handleDashboard,
  label: 'Taking you to your dashboard',
});

useVoiceCommand({
  id: 'welcome',
  phrases: ['welcome', 'go to welcome', 'go to home page', 'back to home page', 'back to home'],
  handler: handleWelcome,
  label: 'Taking you to home page',
});

useVoiceCommand({
  id: 'login',
  phrases: ['login', 'log in', 'go to login'],
  handler: handleLogin,
  label: 'Taking you to login',
});

useVoiceCommand({
  id: 'celebrate',
  phrases: ['celebrate', 'celebrate again', 'confetti', 'more confetti'],
  handler: handleConfetti,
  label: 'Celebrating',
});

  return (
    <div className="fin-page" id="body3">
     <FloatingHelper currentPage="fin" />
     <h1 id="finH1">{t("fin.success_title")}✔️</h1>
    <br/><br/>
    <h3 id="finH3">{t("fin.thank_you")}</h3>
    <br/><br/>
    <div id="links">
        <a href="#" className="fixing" onClick={loading ? (e) => e.preventDefault() : handleDashboard}
        style={{ opacity: loading ? 0.4 : 1, pointerEvents: loading ? "none" : "auto" }}
          
          >{loading ? t("fin.loading_setup") : t("fin.link_dashboard")}</a>
        
        <a  href="#" className="fixing" onClick={loading ? (e) => e.preventDefault() : handleWelcome}
        style={{ opacity: loading ? 0.4 : 1, pointerEvents: loading ? "none" : "auto" }}>{loading ? t("fin.loading_moment") : t("fin.link_home")}</a>

            {/* <!-- <a href="register.html" className="fixing">🧾back to regestration Page</a> --> */}
             
        <a href="#" className="fixing" onClick={loading ? (e) => e.preventDefault() : handleLogin}
        style={{ opacity: loading ? 0.4 : 1, pointerEvents: loading ? "none" : "auto" }}>{loading ? t("fin.loading_moment") : t("fin.link_login")}</a>

        <button  id="con" className="fixing" onClick={handleConfetti}>🎉 {t("fin.celebrate_btn")}</button> 
        {/* <a href="javascript:void(0)" onClick={handleConfetti}> 🎉 Celebrate Again </a> */}
        
    
    </div>
    
    </div>
  );
}