import "../styles/register-login.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
//  import {validateUsername} from "../assets/components/Validations.js";
import { useEffect } from "react";
import { isValidEmail } from "../assets/components/Validations.js";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.js";
import FloatingHelper from "../assets/components/Floatinghelper";
import api from "../api/axios.js";
import { useVoiceCommand } from '../assets/hooks/useVoiceCommand.js';
import { VoiceCommandProvider } from '../assets/components/VoiceCommandContext.jsx';




////// add "remember me box" and add faulty login limiter to alert the user that they have been locked out for 5 minutes after 3 failed attempts and send email to the email associated to the targeted login
//login is one of those few pages that are not logic heavy and lots of code....nice to have .....dashboard on the other hand is a nightmare of code and logic...i'll get to it later...i think....refactoring that ould be a nightmare
export default function Login() {
  //i need to learn to keep the variable declaration AT THE DAMN TOP OF THIS DAMN FUNCTIONS BRO THE HELL!!!
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [usernameFeedback, setUsernameFeedback] = useState("");
  const [usernameColor, setUsernameColor] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);


  //huumm...the browser is playing with me and adding data i didint input ....i want it crispy clean soooo.....didnt work....
  //ahhh the local stogare days and the cookies fights.....when life was simple and without AI
  useEffect(() => {
    setUsername("");
    setPassword("");
  }, []);
  ////////////////

  useVoiceCommand({
    id: 'reset',
    phrases: ['reset', 'forgot password', 'reset password', 'forgot my password', 'i forgot my password'],
    handler: () => navigate('/reset'),
    label: 'Taking you to reset password page',
  });

  useVoiceCommand({
    id: 'welcome',
    phrases: ['welcome', 'go to welcome','go to home page','back to home page','back to home'],
    handler: () => navigate('/'),
    label: 'Taking you to home page',
  });

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };
  ///////////////////////////////
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    //why is this function like 50 % comments?what the fuck is wrong with this code?
    //again...localstorage to the testing rescue...we get theusers existing...i for somereason found users and user....but it just reads users....to  be fixed later
    //const users = JSON.parse(localStorage.getItem("users")) || [];

    //our little tini tiny checker
    // let user = null;
    // we look for the username OR email ...if they exist.then check the password related to that accoount
    // if (isValidEmail(username)) {
    //   // email login
    //   user = users.find((u) => u.email === username);
    // } else {
    //   // username login
    //   user = users.find((u) => u.username === username);
    // }
    // if user not found or password incorrect

    // if (!user || user.password !== password) {
    //   setError("Credentials are incorrect.");
    //   return;
    // }

    try {
      // const response = await axios.post("http://localhost:5000/api/auth/login", {
      const response = await api.post("/auth/login", {
        identifier: username,
        password,
      });

      const data = response.data;
      // console.log(data);
      // store token
      //localStorage.setItem("token", data.token);
      // store user
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      //remove any guests from earlier testing....humor me...
      localStorage.removeItem("isGuest");
      localStorage.removeItem("guestUniversities");

      // check if professor was rejected and needs to pick a major
      if (data.user.pendingReorientation) {
        navigate("/reorientation");
      } else if (data.user.otherInputStatus === "rejected") {
        navigate("/correct-inputs");
      } else {
        //le legin est successful...i'll add a star emoji to this comment later...
        //alert(t("login.success"));feed up with the alert
        navigate("/dashboard");
      }
    } catch (err) {
      //  const msg = err.response?.data?.message || (t("login.error_msg"));
      const msg = t("login.error_msg"); //eehhh....how do i say this....backend msgs are in english and they have preiroty ,so i am diactivating the login one just for display
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const currentLang = i18n.language;

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
    // document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };
  const handleSelectChange = (event) => {
    // Grabs the value ('en', 'fr', or 'ar') from the chosen option
    changeLanguage(event.target.value);
  };



  return (
    <div id="body2">
      <div className="language-switcher">
        <label htmlFor="lang-select" className="sr-only">
          Choose Language:{" "}
        </label>
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

      <FloatingHelper currentPage="login" />

      <form onSubmit={handleSubmit} id="loginForm" autoComplete="off">
        {" "}
        {/*<!--action="dashboard2.1.html"rederect the user to the dashboard after confirming with the database?? --> */}
        <fieldset id="field4">
          <legend id="logReg">{t("login.legend")}</legend>
          <div id="logcenter">
            <label htmlFor="username" id="label">
              {t("login.username_label")}{" "}
            </label>
            <br />
            <br />
            <input
              type="text"
              required
              id="username"
              minLength="5"
              className="username"
              name="username"
              placeholder={t("login.username_placeholder")}
              value={username}
              onChange={handleUsernameChange}
            />
            {/* <p
  id="feedback"
  style={{
    color: usernameColor,
    visibility: username ? "visible" : "hidden"
  }}
>
  {usernameFeedback}
</p>     i figured since this passed the register rigex ten no need for live feedback...    */}
            <br />
            <br />
            <label htmlFor="password" id="label">
              {" "}
              {t("login.password_label")}
            </label>
            <br />
            <br />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder={t("login.password_placeholder")}
              minLength="8"
              maxLength="15"
              name="password"
              required
              value={password}
              onChange={handlePasswordChange}
            />
            <br />
            <label id="label">
              {" "}
              <input
                type="checkbox"
                id="togglePassword"
                onClick={() => setShowPassword(!showPassword)}
              />
              <span id="ohhh"> {showPassword ? " 🙈" : " 👀"}</span>
            </label>
            {/* <span id="ohhh"> {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}</span></label> */}
            <br />
            <br />
            {/* hummm thsi displays the VERY creative error message.... */}
            {error && (
              <p
                style={{
                  color: "#fc0c0c",
                  marginTop: "10px",
                  fontSize: "20px",
                  backgroundColor: "#f7f4f4a7",
                  borderRadius: "12px",
                  width: "40%",
                  marginLeft: "30%",
                }}
              >
                {error}
              </p>
            )}{" "}
            <br />
            <input
  type="submit"
  value={isSubmitting ? "....." : t("login.submit")}
  className="btn2"
  disabled={isSubmitting}
/>
            <br />
            <br />
            <a href="#" id="rrpLink" onClick={() => navigate("/rrp")}>
              {t("login.forgot_password")}
            </a>
            <br />
            <br />
            <a href="#" id="backLink" onClick={() => navigate("/")}>
              {t("login.back_home")}
            </a>
          </div>
        </fieldset>
      </form>
      <div className="bg2"></div>
    </div>
  );
}
