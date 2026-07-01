import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
 import { useTranslation } from 'react-i18next';
 import i18n from '../i18n/index.js';
 import api from "../api/axios.js";
export default function ReorientationPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [selectedMajor, setSelectedMajor] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
const isRTL = i18n.language === 'ar';



  useEffect(() => {
    // if no reorientation needed, redirect away
    if (!currentUser?.pendingReorientation) {
      navigate("/dashboard");
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedMajor) return alert(t("reorientation.noMajorError"));
    setLoading(true);
    try {
      // const res = await axios.post(
      //   "http://localhost:5000/api/users/select-major",
      //   { selectedMajor },
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );

      const res = await api.post("/users/select-major", { selectedMajor });
      // update currentUser in localStorage
      const updatedUser = {
        ...currentUser,
        majors: [selectedMajor],
        pendingReorientation: false
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      // console.log(currentUser);

      alert(t("reorientation.successMessage"))
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
    
  };


  const currentLang = i18n.language;
   
  
  
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    // document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };
  const handleSelectChange = (event) => {
      // Grabs the value ('en', 'fr', or 'ar') from the chosen option
      changeLanguage(event.target.value);
    };
  
  

  return (
    <div style={{
      minHeight: "100vh", background: "#1a1f35", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
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
      <div style={{
        background: "#252b45", borderRadius: "12px", padding: "32px",
        width: "100%", maxWidth: "480px"
      }}>
        <h2   dir={isRTL ? "rtl" : "ltr"} style={{ margin: "0 0 8px" }}>{t("reorientation.title")}</h2>
        <p dir={isRTL ? "rtl" : "ltr"} style={{ opacity: 0.6, marginBottom: "24px", fontSize: "14px" }}>
          {t("reorientation.subtitle")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {currentUser?.majors?.map(major => (
            <label key={major} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px", borderRadius: "8px", cursor: "pointer",
              background: selectedMajor === major ? "rgba(100,118,175,0.3)" : "rgba(255,255,255,0.05)",
              border: selectedMajor === major ? "1px solid #6476af" : "1px solid transparent",
              transition: "all 0.2s"
            }}>
              <input
                type="radio"
                name="major"
                value={major}
                checked={selectedMajor === major}
                onChange={() => setSelectedMajor(major)}
              />
              {major}
            </label>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedMajor || loading}
          style={{
            width: "100%", padding: "12px", borderRadius: "8px",
            background: selectedMajor ? "#6476af" : "rgba(255,255,255,0.1)",
            border: "none", color: "white", fontSize: "15px",
            cursor: selectedMajor ? "pointer" : "not-allowed",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? t("reorientation.saving") : t("reorientation.confirm")}
        </button>
      </div>
    </div>
  );
}