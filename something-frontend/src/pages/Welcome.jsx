import logo2 from "../photos/logo2.png"
 import "../styles/welcome.css"
 import { useNavigate } from "react-router-dom";
 import { useState } from "react";
import Select from "react-select";

import axios from "axios";


export default function Welcome(){
  const navigate = useNavigate();

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedUniversities, setSelectedUniversities] = useState([]);


   const universityOptions = [
  { "value": "UA1", "label": "University Of Algiers 1- Benyoucef Benkhedda" },
  { "value": "UA2", "label": "University Of Algiers 2- Abou El Kacem Saadallah" },
  { "value": "UA3", "label": "University Of Algiers 3- Dely Ibrahim" },
  { "value": "USTHB", "label": "University Of Science And Technology Houari Boumediene" },
  { "value": "ENP", "label": "National Polytechnic School Of Algiers" },
  { "value": "ESNA", "label": "National Higher School of Agronomy" },
  { "value": "NHV", "label": "National Higher Veterinary School" },
  { "value": "BMU", "label": "Badji Mokhtar University-Annaba" },
  { "value": "UB1", "label": "University Of Batna 1" },
  { "value": "UB2", "label": "University Of Batna 2" },
  { "value": "UBj", "label": "University Of Bejaia" },
  { "value": "UBs", "label": "University Of Biskra Mohamed Khider" },
  { "value": "UBl1", "label": "University Of Blida 1-Saad Dahlab" },
  { "value": "Ubl2", "label": "University Of Blida 2-Ali Lounici" },
  { "value": "UCh", "label": "University Of Chlef-Hassiba Benbouali" },
  { "value": "UC1", "label": "University Of Constantine 1-Mentouri Brothers" },
  { "value": "UC2", "label": "University Of Constantine 2-Abdelhamid Mehri" },
  { "value": "UC3", "label": "University Of Constantine 3-Salah Boubnider" },
  { "value": "UD", "label": "University of Djelfa - Ziane Achour" },
  { "value": "UG", "label": "University of Guelma - 8 May 1945" },
  { "value": "UJ", "label": "University of Jijel" },
  { "value": "UL", "label": "University of Laghouat - Amar Telidji" },
  { "value": "UM", "label": "University of Mostaganem - Abdelhamid Ibn Badis" },
  { "value": "UMs", "label": "University of M'Sila - Mohamed Boudiaf" },
  { "value": "UO1", "label": "University of Oran 1 - Ahmed Ben Bella" },
  { "value": "UO2", "label": "University of Oran 2 - Mohamed Ben Ahmed" },
  { "value": "USTO", "label": "University of Science and Technology of Oran - Mohamed Boudiaf" },
  { "value": "UOr", "label": "University of Ouargla - Kasdi Merbah" },
  { "value": "USa", "label": "University of Saida - Dr. Moulay Tahar" },
  { "value": "USBA", "label": "Djillali Liabes University of Sidi Bel Abbes" },
  { "value": "USk", "label": "University of Skikda - 20 August 1955" },
  { "value": "USA", "label": "University of Souk Ahras - Mohamed Cherif Messaadia" },
  { "value": "US1", "label": "University of Setif 1 - Ferhat Abbas" },
  { "value": "US2", "label": "University of Setif 2" },
  { "value": "UTi", "label": "University of Tiaret - Ibn Khaldoun" },
  { "value": "UTl", "label": "University of Tlemcen - Abou Bekr Belkaid" },
  { "value": "UTO", "label": "University of Tizi Ouzou - Mouloud Mammeri" }
]

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

  return (
    <div id="body0">
  <div className="home-container">
    <img src={logo2} alt="Logo" className="logo"/>

    <h1 className="welcome">Welcome <span className="wave">👋</span></h1>
    <p className="quote">Perfection is overrated. Persistence builds better stories.Join us and we can Learn, Teach and Build — Together....</p>
    <div className="buttons">
      <button id="guestBtn"  onClick={() => setShowGuestModal(true)}>Continue as Guest</button>
      <button id="createBtn" onClick={() => navigate("/info")}>Create Account</button>
      <button id="loginBtn"  onClick={() => navigate("/login")}>Login</button>
    </div>
  </div>


{/* //guest shit */}
  {showGuestModal && (
  <div style={{borderRadius:"9px",backgroundColor:"#537a87c5"}} className="modal-overlay" onClick={() => setShowGuestModal(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      
      <h3 style={{color:"black"}}>Select up to 5 universities to browse</h3>
      <br/>
      <Select
        isMulti
        options={universityOptions}
        value={selectedUniversities}
        onChange={(selected) => {
          if (selected.length <= 5) setSelectedUniversities(selected);
        }}
        placeholder="Select universities..."
        styles={customSelect}
      />
      <br/>
      <div style={{display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"15px"}}>
        <button onClick={() => setShowGuestModal(false)} style={{backgroundColor:"crimson", width:"250px",marginRight:"10px",height:"40px" ,color:"white",borderRadius:"8px"}}>Cancel</button>
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
}}>Browse as Guest</button>
      </div>

    </div>
  </div>
)}
  </div>
    );}
