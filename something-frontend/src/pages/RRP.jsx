import "../styles/RRP.css";
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
import { useEffect } from "react";
import { isValidEmail } from "../assets/components/Validations";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import api from "../api/axios.js";

import { useVoiceCommand } from '../assets/hooks/useVoiceCommand.js';
import FloatingHelper from "../assets/components/Floatinghelper";
import { useGuidedFormFill } from '../assets/hooks/useGuidedFormFill.js';



export default function RRP() {
    const navigate = useNavigate();
const [email, setEmail] = useState("");

//i'll add  the voice command for navigation here....just to have something useful
useVoiceCommand({
  id: 'login',
  phrases: ['login', 'log in', 'go to login','already have an account','i have an account','my account exists'],
  handler: () => navigate('/login'),
  label: 'Taking you to login',
});

useVoiceCommand({
  id: 'welcome',
  phrases: ['welcome', 'go to welcome','go to home page','back to home page','back to home'],
  handler: () => navigate('/'),
  label: 'Taking you to home page',
});

const emailFields = [
  { id: 'email', label: 'email', setter: setEmail, confirm: true },
];
const { runWalkthrough: fillEmail } = useGuidedFormFill(emailFields);

useVoiceCommand({
  id: 'fill-email',
  phrases: ['fill my email', 'enter my email', "what's my email", 'fill in email'],
  handler: fillEmail,
  label: 'Starting email entry',
});

    
    const [error, setError] = useState("");

    const { t } = useTranslation();
    
    // form submit handler*/
   const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!isValidEmail(email)) {
    setError(t("rrp.email_invalid"));
    return;
  }

  try {
  
    await api.post("/auth/forgot-password", { email });
    // always show success message — don't reveal if email exists.......damn
alert(t("rrp.success"));
    navigate("/login");
  } catch (err) {
    console.error("Failed to send reset email:", err);
setError(t("rrp.error"));  }
};

  return (
    <div className="RRP" id="body4"> 
        <FloatingHelper currentPage="rrp" />
 
        <form onSubmit={handleSubmit} method="post" id="reset-form">
        <fieldset id="field5">
            <h2> {t("rrp.title")} </h2>
            <br/><br/>
            <label htmlFor="reset-email" className="email">{t("rrp.email_label")}</label>
            <br/>
            <input type="email" id="reset-email" name="reset-email" placeholder={t("rrp.email_placeholder")} required  value={email} onChange={(e) => setEmail(e.target.value)} />
            <br />
             {error && (
              <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p> )}
            <br/><br/>
            <button type="submit" id="btn4">{t("rrp.submit")}</button>
            <br/><br/>
            <div id="forgotlinks">
               <a href="#" id="backLog" onClick={() => navigate("/login")}>{t("rrp.back_login")}</a>
               <br/><br/>
                <a href="#" id="backHome" onClick={() => navigate("/")}>{t("rrp.back_home")}</a>
           </div>
        </fieldset>
        
    </form>
    </div>
  );
}
