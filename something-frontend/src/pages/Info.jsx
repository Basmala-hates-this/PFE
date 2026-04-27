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





export default function Info() {
  

  // handllers to be updated while user fills the form*/
  const [fullName, setFullName] = useState("");
const [birthDate, setBirthDate] = useState("");
const [email, setEmail] = useState("");
const [university, setUniversity] = useState({ code: "", name: "" });
const [role, setRole] = useState("");


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

const selectedMajorOptions = majors.map(m => ({
  value: m,
  label: m
}));

//effect that gets stred data and allows update:
// useEffect(() => {
//   const defaultMajors = [
//     "Computer Science",
//     "Mathematics",
//     "Physics",
//     "Chemistry",
//     "Biology",
//     "Civil Engineering",
//     "Mechanical Engineering",
//     "Electrical Engineering",
//     "Process Engineering",
//     "Architecture",
//     "Natural and Life Science",
//     "Agronomy",
//     "Renewable Energies",
//     "Geology",
//     "Medicine",
//     "Pharmacy",
//     "Dental Medicine",
//     "Veterinary Medicine",
//     "Law",
//     "Political Science & International Relations",
//     "Economics & Commerce & Management Science",
//     "History",
//     "Psychology",
//     "Sociology",
//     "Philosophy",
//     "Literature & Languages",
//     "Information & Communucation Science",
//     "Sport Science & Physical Education",
//     "Art & Design"
//   ];
//   //hummm...i deleted the data when i added a new non existing major...fuck...fixing
//   // Get stored majors, if any
//   const stored = JSON.parse(localStorage.getItem("majors")) || [];

//   // Merge without duplicates
//   const mergedMajors = [...new Set([...defaultMajors, ...stored])];
//   setAvailableMajors(mergedMajors);
//    localStorage.setItem("majors", JSON.stringify(mergedMajors));
// }, []);

//hum...lets try the major select thingy to the uni select thingy
const [isOtherUniversity, setIsOtherUniversity] = useState(false);
const [availableUniversities, setAvailableUniversities] = useState([]);
//fancy wancy react select for unis...
const universityOptions = availableUniversities.map(u => ({
  value: u.code,
  label: u.name
}));

const selectedUniversityOption = university.code
  ? {
      value: university.code,
      label: university.name
    }
  : null;

//the effect for universities/i feel like i wrote this wrong
// useEffect(() => {
//   const defaultUniversities = [
//   { code: "UA1", name: "University Of Algiers 1- Benyoucef Benkhedda" },
//   { code: "UA2", name: "University Of Algiers 2- Abou El Kacem Saadallah" },
//   { code: "UA3", name: "University Of Algiers 3- Dely Ibrahim" },
//   { code: "USTHB", name: "University Of Science And Technology Houari Boumediene" },
//   { code: "ENP", name: "National Polytechnic School Of Algiers" },
//   { code: "ESNA", name: "National Higher School of Agronomy" },
//   { code: "NHV", name: "National Higher Veterinary School" },
//   { code: "BMU", name: "Badji Mokhtar University-Annaba" },
//   { code: "UB1", name: "University Of Batna 1" },
//   { code: "UB2", name: "University Of Batna 2" },
//   { code: "UBj", name: "University Of Bejaia" },
//   { code: "UBs", name: "University Of Biskra Mohamed Khider" },
//   { code: "UBl1", name: "University Of Blida 1-Saad Dahlab" },
//   { code: "Ubl2", name: "University Of Blida 2-Ali Lounici" },
//   { code: "UCh", name: "University Of Chlef-Hassiba Benbouali" },
//   { code: "UC1", name: "University Of Constantine 1-Mentouri Brothers" },
//   { code: "UC2", name: "University Of Constantine 2-Abdelhamid Mehri" },
//   { code: "UC3", name: "University Of Constantine 3-Salah Boubnider" },
//   { code: "UD", name: "University of Djelfa - Ziane Achour" },
//   { code: "UG", name: "University of Guelma - 8 May 1945" },
//   { code: "UJ", name: "University of Jijel" },
//   { code: "UL", name: "University of Laghouat - Amar Telidji" },
//   { code: "UM", name: "University of Mostaganem - Abdelhamid Ibn Badis" },
//   { code: "UMs", name: "University of M'Sila - Mohamed Boudiaf" },
//   { code: "UO1", name: "University of Oran 1 - Ahmed Ben Bella" },
//   { code: "UO2", name: "University of Oran 2 - Mohamed Ben Ahmed" },
//   { code: "USTO", name: "University of Science and Technology of Oran - Mohamed Boudiaf" },
//   { code: "UOr", name: "University of Ouargla - Kasdi Merbah" },
//   { code: "USa", name: "University of Saida - Dr. Moulay Tahar" },
//   { code: "USBA", name: "Djillali Liabes University of Sidi Bel Abbes" },
//   { code: "USk", name: "University of Skikda - 20 August 1955" },
//   { code: "USA", name: "University of Souk Ahras - Mohamed Cherif Messaadia" },
//   { code: "US1", name: "University of Setif 1 - Ferhat Abbas" },
//   { code: "US2", name: "University of Setif 2" },
//   { code: "UTi", name: "University of Tiaret - Ibn Khaldoun" },
//   { code: "UTl", name: "University of Tlemcen - Abou Bekr Belkaid" },
//   { code: "UTO", name: "University of Tizi Ouzou - Mouloud Mammeri" },
  
// ]; 

//   const storedUniversities = JSON.parse(localStorage.getItem("universities")) || [];

//   const mergedUniversities = [...defaultUniversities];

//   // add stored custom universities if they don't already exist//the code is....NUUUUUULLLLL
//   //am i stupid this should not be null...this will cause little to tooo much problems....fuck..i need to find it
//   storedUniversities.forEach(u => {
//     if (!mergedUniversities.some(d => d.name === u.name)) {
//       mergedUniversities.push(u);
//     }
//   });

//   setAvailableUniversities(mergedUniversities);

//   // persist merged list
//   localStorage.setItem("universities", JSON.stringify(mergedUniversities));
// }, []);

useEffect(() => {
  const fetchData = async () => {
    try {
      const [uniRes, majorRes] = await Promise.all([
        axios.get("http://localhost:5000/api/auth/universities"),
        axios.get("http://localhost:5000/api/auth/majors")
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
    const response = await axios.get(
      `http://localhost:5000/api/auth/check-email?email=${email}`
    );
    if (response.data.exists) {
      setError("Email already exists...Login instead?");
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



//back to update the submitter with new data...i have no idea how much things this is breaking...
let finalMajors = [...majors];;

// if user typed a custom major(aka other)//we do the same process to unis tomorow
if (customMajor.trim()) {
    finalMajors.push(customMajor.trim());
}

// if (customMajor.trim()) {
//   const storedMajors = JSON.parse(localStorage.getItem("majors")) || [];

//   if (!storedMajors.includes(customMajor.trim())) {
//     const updatedMajors = [...storedMajors, customMajor.trim()];
//     localStorage.setItem("majors", JSON.stringify(updatedMajors));
//     setAvailableMajors(updatedMajors);
//   }
// }
//soooo....dev tool manupilation precaution ...am i paranoid at this point?
if (role === "student" && finalMajors.length !== 1) {
  alert("Students must select exactly one major.");
  return;
}

if (role === "professor" && finalMajors.length < 1) {
  alert("Professors must select at least one major.");
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

  // const storedUniversities =
  //   JSON.parse(localStorage.getItem("universities")) || [];

  // if (!storedUniversities.some(u => u.code === uniCode)) {
  //   const updatedUniversities = [...storedUniversities, finalUniversity];
  //   localStorage.setItem("universities", JSON.stringify(updatedUniversities));
  //   setAvailableUniversities(prev => [...prev, finalUniversity]);
  // }
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

  const result = validateProfile(profile);

  if (!result.valid) {
    alert(result.error);
    return;
  }
// decided on otp verification now....
try {
    await axios.post("http://localhost:5000/api/auth/send-otp", { email });
    setProfile(profile);
    navigate("/register");
  } catch (err) {
    console.error("Failed to send verification to email:", err);
    alert("Failed to send verification email. Please check your email and try again.");
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
      

    return (
        <div id="body1">
             <form  onSubmit={handleSubmit} id="indexForm">{/*<!--action="register.html"   i think this is useless since i added the js redirection--> */}
        <fieldset id="field1" className="fieldInfo" >
           
             <legend id="legend1">Create Your Account</legend>
             <h3 id="h3">All Information Is Required</h3>

             <fieldset id="field2">
  
              <legend id="legend2">Personal Info</legend>
              <label htmlFor="name" >Full Name:</label>
              <br/>
              <input type="text" className="name" id="name" required  name="fullName" placeholder="Ex:Hannibal Lecter"  onChange={(e) => setFullName(e.target.value)}/>
              <br/><br/>
              <label htmlFor="birth" >Your Date Of Birth:</label>
              <br/>
              <input type="date" id="birth"  className="birth" name="dateOfBirth" required onChange={(e) => setBirthDate(e.target.value)}/>
              <br/><br/>
              <label htmlFor="email" id="PEmail" >Your Professional Email:</label>
              <br/>
             <input type="email" className="PEmail" id="email" name="email" placeholder="something@something.something" required onChange={(e) => setEmail(e.target.value)}
             onBlur={handleEmailBlur}/>
             <br />
             {/* in hopes this works to fix the email uniqueness...is that a word?...couldnt care less...yeah it workes....for now */}
             {error && (
              <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p> )}
  {/* that works....works completly fine but for the sake of my testing...i should nake it an alert..atleast for now */}
             
              <br/><br/>
              <label htmlFor="university" >Your University :</label>
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
  placeholder="Select University..."
/>
              <br/><br/>
            {isOtherUniversity && (
  <input
    type="text"
    className="other"
    placeholder="the full correct name please"
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
                
               <legend  id="legend2">Practical Info</legend>
                
               <label>Are You A:</label> 
               <input type="radio" id="student" name="role" value="student" className="student" required  checked={role === "student"} onChange={(e) => setRole(e.target.value)}/> <label htmlFor="student">Student</label>
               <input type="radio" id="professor" name="role" value="professor" className="professor" required  checked={role === "professor"} onChange={(e) => setRole(e.target.value)}/> <label htmlFor="professor">Professor</label>
                <br/><br/>
                <label htmlFor="major" id="major">Choose a Role to Select Your Main Major(s) </label>
                <br/>
                {/* ONE RING TO RULE THEM ALL .....select i mean one select to rule them all*/}
                {/* so spending along time on perfecting the one select thing just to decide to do something similar to choice.js is biond self hate at this point
                anyow...if i liked how react-select works..then the unis will get it tooooo...the autocomplete is back...i'll rutn it off for a while
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
      placeholder="Select Major(s)..."   id="professorselect"
 
    />
  </>
)}
<br /><br />
{isProf && (<input type="file" id="IsProf" className="IsProf" onChange={(e) => setProfProof(e.target.files[0])} />
)}
<br />
{isProf && (<small style={{color:"black", fontSize:"1.2rem"}}>Proof Documentation please,work contract or a degree</small> )}


<br /><br />
{isOtherMajor && (
  <input
    type="text"
    className="other"
    placeholder="Enter Major"
    value={customMajor}
    onChange={(e) => setCustomMajor(e.target.value)}
  />
)}


                <br/>
              
            </fieldset>
        
           <br/><br/>
            <input type="submit" value="Next" id="btn1"/>  {/* onClick={() => navigate("/register")} */}
           <br/><br/>
            <a href="#" id="InfoLink" onClick={() => navigate("/")} style={{marginRight:"30px"}}>
              Back to Home?
            </a>
           <a href="#" id="InfoLink" onClick={() => navigate("/login")}>
              Already Have An Account?
            </a>
        </fieldset>
    
     </form>
        <div className="bg1"></div>
        </div>
    );}