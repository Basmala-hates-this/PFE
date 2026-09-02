 import "../styles/info.css"
  import { useNavigate } from "react-router-dom";
import {validateProfile } from "../assets/components/Validations.js";
import { useState } from "react";
import { useEffect } from "react";
import { useRegistration } from "../assets/components/Context.jsx";
import axios from "axios";
//remember my crashout because of choices.js and how much i hated that thing?-freindly comments because it's ramadan..-
//i'm doing it again..but in react...introducing "isMulti" and hoping for the best..it needs an import
import Select from "react-select";
//i have to npm download it...npm install react-select...///can i install a brain first?

////////////////////
//pd: CLEAN THE DAMN COMMENTED PARTS U DONT NEED THEM ANYMORE.....i'll do later....donezo...i left my commenst though...
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.js';
import FloatingHelper from "../assets/components/Floatinghelper";

import api from "../api/axios.js";
import { useVoiceCommand } from '../assets/hooks/useVoiceCommand.js';

import { useGuidedFormFill } from '../assets/hooks/useGuidedFormFill.js';
import * as chrono from 'chrono-node';
import fuzzysort from 'fuzzysort';



export default function Info() {


  const { t, i18n } = useTranslation();
const isRTL = i18n.language === "ar";
  

  // handllers to be updated while user fills the form*/
  const [fullName, setFullName] = useState("");
const [birthDate, setBirthDate] = useState("");
const [email, setEmail] = useState("");
const [university, setUniversity] = useState({ code: "", name: "" });
const [role, setRole] = useState("");


const [isSubmitting, setIsSubmitting] = useState(false);


//i'll add  the voice command for navigation here....just to have something useful
//ps:add the other 2 languages dude.....when i feel like it though
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

//prof proof
let isProf;
if (role === "professor") {
  isProf = true;
}else{isProf=false}
const [profProof, setProfProof] = useState(null);


  //context is the kinda freindly replace of localstorage
  //anything but an actual databse for now
  const { setProfile } = useRegistration();
 
const navigate = useNavigate();
//me finds that the current/old select isnt working fine for my perfectionest ass
//me wants to change it
//variables i would need
const [availableMajors, setAvailableMajors] = useState([]);
const [majors, setMajors] = useState([]);
const [customMajor, setCustomMajor] = useState("");
//that damn input does not want to disapear....i'll force it to...
//my bad...react concider a lenght of 0 and elemnt so it was showing...funny how in l1 i hated bolean and ternery elemnts but now i use them more then anything
//and nafie saw them in a code and said this isnt our working....i knew i shouldnt bother with sad....
const [isOtherMajor, setIsOtherMajor] = useState(false);

//i keep getting lost in this code ........anyhow..unis -the custom ones-should have a unique name...i aint making it extravigant..i messed the word
//the code would be JUST_THE_NAME_IN_UPPERCASE_WITHOUTS_SPACE just like that....wish me luck
const generateUniversityCode = (name) => {//the names of the functions are just getting longer and longer because i decided the names will make sense from now on
  //stupid decision if u ask me//but also a smart one....
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")//uppercase+numbers...anything else is a _
    .replace(/^_|_$/g, "");//because my ass is creative the first one adds a _ at the start and end....we clean that ....
};
//this seems to be around the correct place to add the vars for the react-select for the majors....right?
const majorOptions = availableMajors.map(m => ({
  value: m,
  label: m
}));

// const selectedMajorOptions = majors.map(m => ({
//   value: m,
//   label: m
// }));

const selectedMajorOptions = [
  ...majors.map(m => ({ value: m, label: m })),
  ...(isOtherMajor ? [{ value: "OTHER", label: "Other" }] : [])
];

//   //hummm...i deleted the data when i added a new non existing major...fuck...fixing
//   // Get stored majors, if any


//hum...lets try the major select thingy to the uni select thingy
const [isOtherUniversity, setIsOtherUniversity] = useState(false);
const [availableUniversities, setAvailableUniversities] = useState([]);
//fancy wancy react select for unis...
const universityOptions = availableUniversities.map(u => ({
  value: u.code,
  label: u.name
}));



const selectedUniversityOption = isOtherUniversity
  ? { value: "OTHER", label: "Other" }  // show "Other" as selected
  : university.code
    ? { value: university.code, label: university.name }
    : null;



useEffect(() => {
  const fetchData = async () => {
    try {
    
      const [uniRes, majorRes] = await Promise.all([
  api.get("/auth/universities"),
  api.get("/auth/majors")
]);
      setAvailableUniversities(uniRes.data);
      setAvailableMajors(majorRes.data);
    } catch (err) {
      console.error("Failed to fetch universities/majors", err);
    }
  };
  fetchData();
}, []);


//reset the select when changing the role.....
useEffect(() => {
  setMajors([]);
  setCustomMajor("");
  setIsOtherMajor(false); //hided the damn other input...i will not elaborate...but i hate my testing and what it reveals
}, [role]);
//..............email should also be unique........damn....how do i keep forgetting about this stuff?

const [error, setError] = useState("");

//the backend ceck of email existence
const handleEmailBlur = async () => {
  if (!email) return;
  try {
   
    const response = await api.get(`/auth/check-email?email=${email}`);
    if (response.data.exists) {
      setError(t("validation.email_already_exists"));
    } else {
      setError("");
    }
  } catch (err) {
    console.error("Email check failed", err);
  }
};

// form submit handler */i friking need a way to find this segment faster bro...this code is bigger then my ego
const handleSubmit = async (e) => {
  
  e.preventDefault();
 if (error) return;


  setIsSubmitting(true);



//back to update the submitter with new data...i have no idea how much things this is breaking...
let finalMajors = [...majors];;

// if user typed a custom major(aka other)//we do the same process to unis tomorow
if (customMajor.trim()) {
    finalMajors.push(customMajor.trim());
}


//soooo....dev tool manupilation precaution ...am i paranoid at this point?
if (role === "student" && finalMajors.length !== 1) {
  alert(t("validation.student_one_major"));
  return;
}

if (role === "professor" && finalMajors.length < 1) {
  alert(t("validation.professor_min_major"));
  return;
}
let finalUniversity = university;

//how about doing the uni validation right before the oint i need it in?
//changing the original because i stupidly set the costom uni code to be null....
if (isOtherUniversity && university.name.trim()) {
  const uniName = university.name.trim();
  const uniCode = generateUniversityCode(uniName);

  finalUniversity = {
    code: uniCode,
    name: uniName,
  };

}
//u know...for times like when i decide to make the variable names make sense.....i'm gratful for vs code to suggest the names i need instead of typing the enrite shit...fuck





  const profile = {
    fullName,
    birthDate,
    email,
    university :finalUniversity,
    role,
    majors:finalMajors,
    profProof
  };

  const result = validateProfile(profile, t);

  if (!result.valid) {
    alert(result.error);
    setIsSubmitting(false);
    return;
  }
// decided on otp verification now....
try {

    await api.post("/auth/send-otp", { email });
    setProfile(profile);
    navigate("/register");
  } catch (err) {
    console.error("Failed to send verification to email:", err);
    alert("Failed to send verification email. Please check your email and try again.");
    setIsSubmitting(false);
  }
 


  // Save to localStorage.....i need to abandon the local storage at some point....that is SAD....
  // localStorage.setItem("user", JSON.stringify(profile));
  //use context instead
  setProfile(profile);


 navigate("/register");//i think i did this twice?.....i'll fix it later....fixed
};

//people who created something that works so nicley couldnt be botherd to style it nicely huh?...
//anyhow the chuncky look of react select gives me Choices.js trauma....
// i need to fix that
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
      
const currentLang = i18n.language;
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

// the voice filling form
// you cant say i dont hate my self,this is painful to build
  const normalizeBirthDate = (raw) => {
  const parsed = chrono.parseDate(raw);
  return parsed ? parsed.toISOString().slice(0, 10) : raw; // leave raw as-is on failure — validate() below catches it
};
const isValidISODate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeRole = (raw) => {
  const n = raw.toLowerCase();
  if (n.includes('prof')) return 'professor';
  if (n.includes('stud') || n.includes('étud') || n.includes('etu') || n.includes('طالب')) return 'student';
  return raw; // unrecognized — fails validate, triggers retry
};
const isValidRole = (value) => value === 'student' || value === 'professor';


// threshold is fuzzysort's score (negative, closer to 0 = better match).
// -10000 is generous — tuned loose because voice transcripts are messy
// (missed words, wrong article, accent mishears). Tighten if it starts
// accepting matches that are actually wrong once you test with real speech.
const FUZZY_THRESHOLD = -10000;

const fuzzyFind = (raw, list, getLabel) => {
  const result = fuzzysort.go(raw.trim(), list, {
    key: getLabel,
    threshold: FUZZY_THRESHOLD,
    limit: 1,
  });
  return result.length ? result[0].obj : null;
};


const fillFields = (answers) => {
  const fields = [
    { id: 'fullName', label: 'full name', setter: setFullName },
    {
      id: 'birthDate', label: 'date of birth', setter: setBirthDate,
      normalize: normalizeBirthDate, validate: isValidISODate,
    },
    {
      id: 'email', label: 'email', setter: setEmail,
      confirm: true, // per your earlier answer — read back + require spoken yes
    },
    { id: 'role', label: 'role — student or professor', setter: setRole, normalize: normalizeRole, validate: isValidRole },
  ];

  // university: only ask once we know whether "other" flow needs setting up.
  // Doesn't actually depend on role/major, listed here so it's asked before majors.
  fields.push({
    id: 'university', label: 'university', setter: (raw) => {
      const match = fuzzyFind(raw, availableUniversities, (u) => u.name);
      if (match) {
        setUniversity(match);
        setIsOtherUniversity(false);
      } else {
        setUniversity({ code: null, name: raw });
        setIsOtherUniversity(true);
      }
    },
  });

  // majors: depends on answers.role, which is why fields is a FUNCTION —
  // this branch literally can't be decided until the role field lands.
  if (answers.role === 'professor') {
    fields.push({
      id: 'majors', label: 'major (you can list more than one)', multi: true,
      setter: (values) => {
        const matched = values.map((v) => fuzzyFind(v, availableMajors, (m) => m) || v);
        setMajors(matched.filter((m) => availableMajors.includes(m)));
        const unmatched = matched.filter((m) => !availableMajors.includes(m));
        if (unmatched.length) { setIsOtherMajor(true); setCustomMajor(unmatched[0]); }
      },
    });
  } else if (answers.role === 'student') {
    fields.push({
      id: 'major', label: 'major', setter: (raw) => {
        const match = fuzzyFind(raw, availableMajors, (m) => m);
        if (match) { setMajors([match]); setIsOtherMajor(false); }
        else { setIsOtherMajor(true); setCustomMajor(raw); }
      },
    });
  }
  // profProof (file upload) intentionally excluded — not voice-fillable

  return fields;
};

const { runWalkthrough } = useGuidedFormFill(fillFields);

useVoiceCommand({
  id: 'fill-form',
  phrases: ['fill out the form', 'help me fill this', 'guide me through the form', 'fill this form by voice'],
  handler: runWalkthrough,
  label: 'Starting the guided form fill',
});

  ////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

    return (
        <div id="body1">
          <div className="language-switcher">
      <label htmlFor="lang-select" className="sr-only">Choose Language: </label>
      <select 
        id="lang-select"
        value={currentLang} // Keeps the dropdown synced with the active language
        onChange={handleSelectChange}
        className="lang-dropdown"
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="ar">العربية</option>
      </select>
    </div>


    <FloatingHelper currentPage="info" /> 


             <form  onSubmit={handleSubmit} id="indexForm">{/*<!--action="register.html"   i think this is useless since i added the js redirection--> */}
        <fieldset id="field1" className="fieldInfo" >
           
             <legend id="legend1">{t("info.legend_main")}</legend>
             <h3 id="h3">{t("info.required_notice")}</h3>

             <fieldset id="field2">
  
              <legend id="legend2">{t("info.personal_info")}</legend>
              <label htmlFor="name" >{t("info.full_name_label")}</label>
              <br/>
              <input type="text" className="name" id="name" required  name="fullName" placeholder={t("info.full_name_placeholder")}  onChange={(e) => setFullName(e.target.value)}/>
              <br/><br/>
              <label htmlFor="birth" >{t("info.birth_label")}</label>
              <br/>
              <input type="date" id="birth"  className="birth" name="dateOfBirth" required onChange={(e) => setBirthDate(e.target.value)}/>
              <br/><br/>
              <label htmlFor="email" id="PEmail" >{t("info.email_label")}</label>
              <br/>
             <input type="email" className="PEmail" id="email" name="email" placeholder={t("info.email_placeholder")} required onChange={(e) => setEmail(e.target.value)}
             onBlur={handleEmailBlur}/>
             <br />
             {/* in hopes this works to fix the email uniqueness...is that a word?...couldnt care less...yeah it workes....for now */}
             {error && (
              <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p> )}
  {/* that works....works completly fine but for the sake of my testing...i should nake it an alert..atleast for now */}
             
              <br/><br/>
              <label htmlFor="university" >{t("info.university_label")}</label>
              <br/>
             
              <Select styles={customSelect}
  className="univ" id="univ" 
  options={[...universityOptions, { value: "OTHER", label: "Other" }]}
  value={selectedUniversityOption}
  onChange={(selected) => {
    if (!selected) return;

    if (selected.value === "OTHER") {
      setUniversity({ code: null, name: "" });
      setIsOtherUniversity(true);
    } else {
      const chosen = availableUniversities.find(
        u => u.code === selected.value
      );
      setUniversity(chosen);
      setIsOtherUniversity(false);
    }
  }}
  placeholder={t("info.university_placeholder")}
/>
              <br/><br/>
            {isOtherUniversity && (
  <input
    type="text"
    className="other"
    placeholder={t("info.university_other_placeholder")}
    value={university.name}
    onChange={(e) =>
      // /////////////////////////////////////////////////////
      setUniversity({ code: null, name: e.target.value })
      ////////////////////////////////////////////////
    }
  />
)}

              <br/><br/>
        
            </fieldset>
             <fieldset id="field3">
                
               <legend  id="legend2">{t("info.practical_info")}</legend>
                
               <label>{t("info.role_label")}</label> 
               <input type="radio" id="student" name="role" value="student" className="student" required  checked={role === "student"} onChange={(e) => setRole(e.target.value)}/> <label htmlFor="student">{t("info.role_student")}</label>
               <input type="radio" id="professor" name="role" value="professor" className="professor" required  checked={role === "professor"} onChange={(e) => setRole(e.target.value)}/> <label htmlFor="professor">{t("info.role_professor")}</label>
                <br/><br/>
                <label htmlFor="major" id="major">{t("info.major_label")}</label>
                <br/>
                {/* ONE RING TO RULE THEM ALL .....select i mean one select to rule them all*/}
                {/* so spending a long time on perfecting the one select thing just to decide to do something similar to choice.js is beyond self hate at this point
                anyhow...if i liked how react-select works..then the unis will get it tooooo...the autocomplete is back...i'll rutn it off for a while
                 */}
             
{role && (
  <>
  {/* i dont want to add more to info.css and tbh..i font know how to target that correctly+inline style will just give me hell so i created a style object here.. */}
    <Select styles={customSelect}
      className="major"
      options={[...majorOptions, { value: "OTHER", label: "Other" }]}
      value={selectedMajorOptions}
      isMulti={role === "professor"}
      onChange={(selected) => {
        const values = selected
          ? (Array.isArray(selected)
              ? selected.map(s => s.value)
              : [selected.value])
          : [];

        if (values.includes("OTHER")) {
          setIsOtherMajor(true);
          setMajors(values.filter(v => v !== "OTHER"));
        } else {
          setIsOtherMajor(false);
          setMajors(values);
          setCustomMajor("");
        }
      }}
      placeholder={t("info.major_placeholder")}   id="professorselect"
 
    />
  </>
)}
<br /><br />
{isProf && (<input type="file" id="IsProf" className="IsProf" onChange={(e) => setProfProof(e.target.files[0])} />
)}
<br />
{isProf && (<small style={{color:"black", fontSize:"1.2rem"}}>{t("info.prof_proof_hint")}</small> )}


<br /><br />
{isOtherMajor && (
  <input
    type="text"
    className="other"
    placeholder={t("info.major_other_placeholder")}
    value={customMajor}
    onChange={(e) => setCustomMajor(e.target.value)}
  />
)}


                <br/>
              
            </fieldset>
        
           <br/><br/>
            <input type="submit" value={isSubmitting ? t("info.submitting") : t("info.submit")}  disabled={isSubmitting} id="btn1"/>  
           <br/><br/>
            <a href="#" id="InfoLink" onClick={() => navigate("/")} style={{marginRight:"30px"}}>
              {t("info.link_back_home")}
            </a>
           <a href="#" id="InfoLink" onClick={() => navigate("/login")}>
              {t("info.link_login")}
            </a>
        </fieldset>
    
     </form>
        <div className="bg1"></div>
        </div>
    );}