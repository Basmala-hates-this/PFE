import logo2 from "../photos/logo2.png"
 import "../styles/welcome.css"
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
import Select from "react-select";
import { useEffect } from "react";

import axios from "axios";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.js';


export default function Welcome(){
  const navigate = useNavigate();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedUniversities, setSelectedUniversities] = useState([]);
const [universityOptions, setUniversityOptions] = useState([]);

const { t } = useTranslation();
const currentLang = i18n.language;

//    const universityOptions = [
//   { "value": "UA1", "label": "University Of Algiers 1- Benyoucef Benkhedda" },
//   { "value": "UA2", "label": "University Of Algiers 2- Abou El Kacem Saadallah" },
//   { "value": "UA3", "label": "University Of Algiers 3- Dely Ibrahim" },
//   { "value": "USTHB", "label": "University Of Science And Technology Houari Boumediene" },
//   { "value": "ENP", "label": "National Polytechnic School Of Algiers" },
//   { "value": "ESNA", "label": "National Higher School of Agronomy" },
//   { "value": "NHV", "label": "National Higher Veterinary School" },
//   { "value": "BMU", "label": "Badji Mokhtar University-Annaba" },
//   { "value": "UB1", "label": "University Of Batna 1" },
//   { "value": "UB2", "label": "University Of Batna 2" },
//   { "value": "UBj", "label": "University Of Bejaia" },
//   { "value": "UBs", "label": "University Of Biskra Mohamed Khider" },
//   { "value": "UBl1", "label": "University Of Blida 1-Saad Dahlab" },
//   { "value": "Ubl2", "label": "University Of Blida 2-Ali Lounici" },
//   { "value": "UCh", "label": "University Of Chlef-Hassiba Benbouali" },
//   { "value": "UC1", "label": "University Of Constantine 1-Mentouri Brothers" },
//   { "value": "UC2", "label": "University Of Constantine 2-Abdelhamid Mehri" },
//   { "value": "UC3", "label": "University Of Constantine 3-Salah Boubnider" },
//   { "value": "UD", "label": "University of Djelfa - Ziane Achour" },
//   { "value": "UG", "label": "University of Guelma - 8 May 1945" },
//   { "value": "UJ", "label": "University of Jijel" },
//   { "value": "UL", "label": "University of Laghouat - Amar Telidji" },
//   { "value": "UM", "label": "University of Mostaganem - Abdelhamid Ibn Badis" },
//   { "value": "UMs", "label": "University of M'Sila - Mohamed Boudiaf" },
//   { "value": "UO1", "label": "University of Oran 1 - Ahmed Ben Bella" },
//   { "value": "UO2", "label": "University of Oran 2 - Mohamed Ben Ahmed" },
//   { "value": "USTO", "label": "University of Science and Technology of Oran - Mohamed Boudiaf" },
//   { "value": "UOr", "label": "University of Ouargla - Kasdi Merbah" },
//   { "value": "USa", "label": "University of Saida - Dr. Moulay Tahar" },
//   { "value": "USBA", "label": "Djillali Liabes University of Sidi Bel Abbes" },
//   { "value": "USk", "label": "University of Skikda - 20 August 1955" },
//   { "value": "USA", "label": "University of Souk Ahras - Mohamed Cherif Messaadia" },
//   { "value": "US1", "label": "University of Setif 1 - Ferhat Abbas" },
//   { "value": "US2", "label": "University of Setif 2" },
//   { "value": "UTi", "label": "University of Tiaret - Ibn Khaldoun" },
//   { "value": "UTl", "label": "University of Tlemcen - Abou Bekr Belkaid" },
//   { "value": "UTO", "label": "University of Tizi Ouzou - Mouloud Mammeri" }
// ]


useEffect(() => {
  axios.get("http://localhost:5000/api/auth/universities")
    .then(res => {
      setUniversityOptions(res.data.map(u => ({ value: u.code, label: u.name })));
    })
    .catch(err => console.error("Failed to fetch universities", err));
}, []);

const customSelect = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "white",
   
    border: "2px solid black", 
    borderRadius: "12px",
    padding: "7px",
    transition: "all 0.2s ease",
      
   minHeight: "10px",
    fontSize: "16px",
    display: "flex",
    alignItems: "center", 
    
  }),valueContainer: (provided) => ({
    ...provided,
    paddingTop: "2px",     
   
    display: "flex",
    alignItems: "center"
  }),

  menu: (provided) => ({
    ...provided,
    backgroundColor: "#ecf1fa",
    borderRadius: "12px",
    overflow: "hidden",
    fontSize: "16px"
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#b3bfe5"
      : state.isFocused
      ? "#6791d5"
      : "#ced7ea",
    color: "#000000",
    cursor: "pointer",
    padding: "10px",
    
  
  }),

  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#6476af",
    borderRadius: "8px",
     marginTop: "2px",       
    marginBottom: "2px"
  }),

  multiValueLabel: (provided) => ({
    ...provided,
    color: "#ffffff"
  }),

  multiValueRemove: (provided) => ({
    ...provided,
    color: "#ffffff",
    
  }),

  singleValue: (provided) => ({
    ...provided,
    color: "#000000",
    marginTop: "2px",
  }),

  placeholder: (provided) => ({
    ...provided,
    color: "#1e1e1f"
  }),

  input: (provided) => ({
    ...provided,
    color: "#232326"
  })
};



const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
  //document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};
const handleSelectChange = (event) => {
    // Grabs the value ('en', 'fr', or 'ar') from the chosen option
    changeLanguage(event.target.value);
  };

  return (
    <div id="body0">
{/* i need style for this later */}
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
  <div className="home-container">
    <img src={logo2} alt="Logo" className="logo"/>

    <h1 className="welcome"><span className="wave">👋</span>{t('welcome.title')}</h1>
    <p className="quote">{t('welcome.quote')}</p> 
    <div className="buttons">
      <button id="guestBtn"  onClick={() => setShowGuestModal(true)}>{t('welcome.guest_btn')}</button>
      <button id="createBtn" onClick={() => navigate("/info")}>{t('welcome.create_btn')}</button>
      <button id="loginBtn"  onClick={() => navigate("/login")}>{t('welcome.login_btn')}</button>
    </div>
  </div>


{/* //guest shit */}
  {showGuestModal && (
  <div style={{borderRadius:"9px",backgroundColor:"#537a87c5"}} className="modal-overlay-welcome" onClick={() => setShowGuestModal(false)}>
    <div className="modal-welcome" onClick={(e) => e.stopPropagation()}>
      
      <h3 >{t('welcome.modal_title')}</h3>
      <br/>
      <Select
        isMulti
        options={universityOptions}
        value={selectedUniversities}
        onChange={(selected) => {
          if (selected.length <= 5) setSelectedUniversities(selected);
        }}
         placeholder={t('welcome.modal_placeholder')}
        styles={customSelect}
         maxMenuHeight={200}
      />
      <br/>
      <div style={{display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"15px"}}>
        <button onClick={() => setShowGuestModal(false)} style={{backgroundColor:"crimson", width:"250px",marginRight:"10px",height:"40px" ,color:"white",borderRadius:"8px"}}>{t('welcome.modal_cancel')}</button>
        {/* is it stupid to write the entire function derectly into the element?not illegall....just stupid... */}
        <button 
style={{backgroundColor:"green", width:"250px",marginRight:"10px",height:"40px" ,color:"white",borderRadius:"8px"}}

        onClick={async () => {
  try {
    const response = await axios.post("http://localhost:5000/api/auth/guest", {
      selectedUniversities
    });
    localStorage.setItem("guestToken", response.data.guestToken);
    localStorage.setItem("guestUniversities", JSON.stringify(selectedUniversities));
    localStorage.removeItem("isGuest");
    setShowGuestModal(false);
    navigate("/dashboard");
  } catch (err) {
    console.error("Failed to create guest session:", err);
  }
}}>{t('welcome.modal_browse')}</button>
      </div>

    </div>
  </div>
)}
  </div>
    );}
