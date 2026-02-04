import "../styles/fin.css"
// import "../scripts/confetti.js"
 import { useNavigate } from "react-router-dom";

import confetti from "canvas-confetti";
 import { useEffect } from "react";

import { useRegistration } from "../assets/components/Context.jsx";
import {
  validateProfile,
  validateUsername,
  checkPasswordStrength
} from "../assets/components/Validations.js";


//just noting that my brain thinks this page should have and be able to read the profile for somereason....maybe the username display for dashboard later?
//meh, i'll see later..if not, no big deal.....i hope...
//also....abut the validations of existing profile...i cant see how anyone would reach here without filling the previos 2 forms
//but better safe than sorry i guess?...dmn it..i should have gone with something simpler like a university planner or something...
//again....sorry sarah...
export default function Fin() {
    const navigate = useNavigate();
    const { profile, credentials } = useRegistration();

    
  const handleConfetti = () => {
    confetti({
      particleCount: 1100,
      spread: 200,
      origin: { y: 0.7 }
    });
  };


  //AAAAAAAAAAAAAAAAAA
  //user efect will check the previosly mentiond...if one is false..rederect to he page needed...if not....well....CONTENT!!
  useEffect(() => {
  // guard: no skipping steps(YOU SHAALLLLL NOOOOOOT PAAAASSSSSSSS!!)
  if (!profile || !credentials) {
    navigate("/info");
    return;
  }

  // final profile validation
  const profileCheck = validateProfile(profile);
  if (!profileCheck.valid) {
    alert(profileCheck.error);
    navigate("/info");
    return;
  }

  // final credential validation
  if (
    !validateUsername(credentials.username).valid ||
    checkPasswordStrength(credentials.password).strength < 4
  ) {
    navigate("/register");
    return;
  }

 
  handleConfetti();
}, []);


//hol'up imma try something stupid
const handleDashboard = () => {
  localStorage.setItem(
    "user",
    JSON.stringify({ profile, credentials })
  );
    navigate("/dashboard");

};

  return (
    <div className="fin-page" id="body3">
     <h1 id="finH1">You Have Successfully Created An Account!!✔️</h1>
    <br/><br/>
    <h3 id="finH3">Thank You For Your Registration!</h3>
    <br/><br/>
    <div id="links">
        <a href="#" className="fixing" onClick={handleDashboard}>🗂️Go To The Dashboard</a>
        
        <a  href="#" className="fixing" onClick={() => navigate("/")}>🏠back to home Page</a>

            {/* <!-- <a href="register.html" className="fixing">🧾back to regestration Page</a> --> */}
             
        <a href="#" className="fixing" onClick={() => navigate("/login")}>🔑back To Login Page</a>
        <button  id="con" className="fixing" onClick={handleConfetti}>🎉 Celebrate Again</button> 
        {/* <a href="javascript:void(0)" onClick={handleConfetti}> 🎉 Celebrate Again </a> */}
        
    
    </div>
    
    </div>
  );
}