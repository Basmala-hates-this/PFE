//  import "../styles/info.css"
//   import { useNavigate } from "react-router-dom";
// import {validateProfile } from "../assets/components/Validations.js";
// import { useState } from "react";
// import { useEffect } from "react";
// import { useRegistration } from "../assets/components/Context.jsx";







// export default function Info() {
  

//   // handllers to be updated while user fills the form*/
//   const [fullName, setFullName] = useState("");
// const [birthDate, setBirthDate] = useState("");
// const [email, setEmail] = useState("");
// const [university, setUniversity] = useState({ code: "", name: "" });
// const [role, setRole] = useState("");
// const [majors, setMajors] = useState([]);

//   //context is the kinda freindly replace of localstorage
//   //anything but an actual databse for now
//   const { setProfile } = useRegistration();
 
// const navigate = useNavigate();

// //reset the select when changing the role.....
// useEffect(() => {
//   setMajors([]);
// }, [role]);
// //..............email should also be unique........damn....how do i keep forgetting about this stuff?

// const [error, setError] = useState("");

// // form submit handler*/
// const handleSubmit = (e) => {
  
//   e.preventDefault();
//   const users = JSON.parse(localStorage.getItem("users")) ||JSON.parse(localStorage.getItem("user")) || [];

// const emailExists = users.some(
//   (u) => u.email === email
// );

// if (emailExists) {
//   setError("Email Already Exists...Login-in Instead?");
//   alert("Email Already Exists...Login-in Instead?");
//   return;
// }

//   const profile = {
//     fullName,
//     birthDate,
//     email,
//     university,
//     role,
//     majors
//   };

//   const result = validateProfile(profile);

//   if (!result.valid) {
//     alert(result.error);
//     return;
//   }




//   // Save to localStorage.....i need to abandon the local storage at some point....that is SAD....
//   // localStorage.setItem("user", JSON.stringify(profile));
//   //use context instead
//   setProfile(profile);


//   // Navigate to next page
//   navigate("/register");//i think i did this twice?.....i'll fix it later....fixed
// };


      

//     return (
//         <div id="body1">
//              <form  onSubmit={handleSubmit} id="indexForm">{/*<!--action="register.html"   i think this is useless since i added the js redirection--> */}
//         <fieldset id="field1" className="fieldInfo" >
           
//              <legend id="legend1">Make Your Account</legend>
//              <h3 id="h3">All Information Is Required</h3>

//              <fieldset id="field2">
  
//               <legend id="legend2">Personal Info</legend>
//               <label htmlFor="name" >Full Name:</label>
//               <br/>
//               <input type="text" className="name" id="name" required minLength="5" name="fullName" placeholder="Ex:Hannibal Lecter"  onChange={(e) => setFullName(e.target.value)}/>
//               <br/><br/>
//               <label htmlFor="birth" >Your Date Of Birth:</label>
//               <br/>
//               <input type="date" id="birth"  className="birth" name="dateOfBirth" required onChange={(e) => setBirthDate(e.target.value)}/>
//               <br/><br/>
//               <label htmlFor="email" id="PEmail" >Your Professional Email:</label>
//               <br/>
//              <input type="email" className="PEmail" id="email" name="email" placeholder="something@something.something" required onChange={(e) => setEmail(e.target.value)}/>
//              <br />
//              {/* in hopes this works to fix the email uniqueness...is that a word?...couldnt care less...yeah it workes....for now */}
//              {/* {error && (
//               <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
//     {error}
//   </p> )}*/}
//   {/* that works....works completly fine but for the sake of my testing...i should nake it an alert..atleast for now */}
             
//               <br/><br/>
//               <label htmlFor="university" >Your University :</label>
//               <br/>
//               <select name="university" id="univ" className="univ" required  defaultValue="" value={university.code}
//   onChange={(e) =>
//     e.target.value === "other"
//       ? setUniversity({ code: null, name: "" })
//       : setUniversity({ code: e.target.value, name: "" })
//   }>
//                 <option value="" disabled > </option>
//                 <option value="A1">University Of Algiers 1- Benyoucef Benkhedda</option>
//                 <option value="A2">University Of Algiers 2- Abou El Kacem Saadallah</option>
//                 <option value="A3">University Of Algiers 3- Dely Ibrahim</option>
//                 <option value="USTHB">University Of Science And Thechnology Houari Boumediene</option>
//                 <option value="ENP">National polytechnic School Of Algiers </option>
//                 <option value="ESNA">National Higher School of Agronomy </option>
//                 <option value="NHV">National Higher Veterinary School</option>
//                 <option value="BMU">Badji Mokhtar University-Annaba</option>
//                 <option value="UB1">University Of Batna 1</option>
//                 <option value="UB2">University Of Batna 2</option>
//                 <option value="UBj">University Of Bejaia</option>
//                 <option value="UBs">University Of Beskra Mohamed Khider Biskra</option>
//                 <option value="UBl1">University Of Blida 1-Saad Dahlab</option>
//                 <option value="Ubl2">University Of Blida 2-Ali Lounici</option>
//                 <option value="UCh">University Of Chlef-Hassiba benbouali</option>
//                 <option value="UC1">University Of Costantine 1-Mentouri Brothers</option>
//                 <option value="UC2">University Of Costantine 2-Abdelhamid Mehri </option>
//                 <option value="UC3">University Of Costantine 3-Salah boubnider</option>
//                 <option value="UD">University of Djelfa - Ziane Achour </option>
//                 <option value="UG">​University of Guelma - 8 May 1945</option>
//                 <option value="UJ">University of Jijel </option>
//                 <option value="UL">University of Laghouat - Amar Telidji</option>
//                 <option value="UM">​University of Mostaganem - Abdelhamid Ibn Badis  </option>
//                 <option value="UMs">University of M'Sila - Mohamed Boudiaf  </option>
//                 <option value="UO1">University of Oran 1 - Ahmed Ben Bella </option>
//                 <option value="UO2">​University of Oran 2 - Mohamed Ben Ahmed </option>
//                 <option value="USTO">University of Science and Technology of Oran - Mohamed Boudiaf</option>
//                 <option value="UOr">University of Ouargla - Kasdi Merbah</option>
//                 <option value="USa">​University of Saida - Dr. Moulay Tahar </option>
//                 <option value="USBA">​Djillali Liabes University of Sidi Bel Abbes  </option>
//                 <option value="USk">University of Skikda - 20 August 1955 </option>
//                 <option value="USA">​University of Souk Ahras - Mohamed Cherif Messaadia  </option>
//                 <option value="US1">University of Setif 1 - Ferhat Abbas </option>
//                 <option value="US2">University of Setif 2</option>
//                 <option value="UTi">University of Tiaret - Ibn Khaldoun</option>
//                 <option value="UTl">​University of Tlemcen - Abou Bekr Belkaid</option>
//                 <option value="UTO">​University of Tizi Ouzou - Mouloud Mammeri</option>
//                 <option value="other">Other</option>



//               </select>
//               <br/><br/>
//              {university.code === null && (
//   <input
//     type="text"
//     className="other"
//     placeholder="Enter university name"
//     onChange={(e) =>
//       setUniversity({ code: null, name: e.target.value })
//     }
//   />
// )}

//               <br/><br/>
        
//             </fieldset>
//              <fieldset id="field3">
                
//                <legend  id="legend2">Practical Info</legend>
                
//                <label>Are You A:</label> 
//                <input type="radio" id="student" name="role" value="student" className="student" required  checked={role === "student"} onChange={(e) => setRole(e.target.value)}/> <label htmlFor="student">Student</label>
//                <input type="radio" id="professor" name="role" value="professor" className="professor" required  checked={role === "professor"} onChange={(e) => setRole(e.target.value)}/> <label htmlFor="professor">Professor</label>
//                 <br/><br/>
//                 <label htmlFor="major" id="major">Choose a Role to Select Your Main Major(s) </label>
//                 <br/>
                
//                 {role === "student" && (
//   <div id="s_select">
//     <select
//     id="studentselect"
//       className="major"
//       defaultValue=""
//       onChange={(e) => setMajors([e.target.value])}
//       required
//     >
//      <option value="" disabled ></option>
//                     <option value="CS"> Computer Science</option>
//                     <option value="Math">Mathematics</option>
//                     <option value="phy">Physics</option>
//                     <option value="chem">Chemistry</option>
//                     <option value="bio">Biology</option>
//                     <option value="CE">Civil Engineering</option>
//                     <option value="ME">Mechanical Engineering</option>
//                     <option value="EE">Electrical Engineering</option>
//                     <option value="Pe">Process Engineering</option>
//                     <option value="Ar">Architecture</option>
//                     <option value="NLS">Natural and Life Science</option>
//                     <option value="Ag">Agronomy</option>
//                     <option value="RE">Renewable Energies</option>
//                     <option value="Geo">Geology</option>
//                     <option value="Med">Medicine</option>
//                     <option value="Ph">Pharmacy</option>
//                     <option value="DM">Dental Medicine</option>
//                     <option value="VM">Veterinary Medicine</option>
//                     <option value="Law">Law</option>
//                     <option value="PS">Political Science & International Relations</option>
//                     <option value="Ec">Economics & Commerce & Management Science</option>
//                     <option value="Hs">History</option>
//                     <option value="Ps">psychology</option>
//                     <option value="So">Sociology</option>
//                     <option value="Phil">Philosophy</option>
//                     <option value="LL">Literature & Languages</option>
//                     <option value="ICS">Information & Communucation Science</option>
//                     <option value="SSP">Sport Science & Physical Education</option>
//                     <option value="AD">Art & Design</option>
//     </select>
//   </div>
// )}

//                 <br/>
//                 {role === "professor" && (
//                 <div id="p_select">
//                 <select name="profMajor" className="major" id="professorselect" multiple  onChange={(e) =>
//     setMajors([...e.target.selectedOptions].map(o => o.value))
//   } >
                  
//                     <option value="CS"> Computer Science</option>
//                     <option value="Math">Mathematics</option>
//                     <option value="phy">Physics</option>
//                     <option value="chem">Chemistry</option>
//                     <option value="bio">Biology</option>
//                     <option value="CE">Civil Engineering</option>
//                     <option value="ME">Mechanical Engineering</option>
//                     <option value="EE">Electrical Engineering</option>
//                     <option value="Pe">Process Engineering</option>
//                     <option value="Ar">Architecture</option>
//                     <option value="NLS">Natural and Life Science</option>
//                     <option value="Ag">Agronomy</option>
//                     <option value="RE">Renewable Energies</option>
//                     <option value="Geo">Geology</option>
//                     <option value="Med">Medicine</option>
//                     <option value="Ph">Pharmacy</option>
//                     <option value="DM">Dental Medicine</option>
//                     <option value="VM">Veterinary Medicine</option>
//                     <option value="Law">Law</option>
//                     <option value="PS">Political Science & International Relations</option>
//                     <option value="Ec">Economics & Commerce & Management Science</option>
//                     <option value="Hs">History</option>
//                     <option value="Ps">psychology</option>
//                     <option value="So">Sociology</option>
//                     <option value="Phil">Philosophy</option>
//                     <option value="LL">Literature & Languages</option>
//                     <option value="ICS">Information & Communucation Science</option>
//                     <option value="SSP">Sport Science & Physical Education</option>
//                     <option value="AD">Art & Design</option>
//                 </select>
//                 </div>
//                 )}
//                 {/* {role === "student" && <StudentMajorSelect />}
//                 {role === "professor" && <ProfessorMajorSelect />}  these are to toggle later....i hate react */}

//                 <br/>
//                 {/* <!-- <small id="small">Hold on 'Ctrl' or 'Cmd' to have multiple choices</small> -->
//                  */}
//             </fieldset>
        
//            <br/><br/>
//             <input type="submit" value="Next" id="btn1"/>  {/* onClick={() => navigate("/register")} */}
//            <br/><br/>
//            <a href="#" id="InfoLink" onClick={() => navigate("/login")}>
//               Already Have An Account?
//             </a>
//         </fieldset>
    
//      </form>
//         <div className="bg1"></div>
//         </div>
//     );}



///imma change plenty of shit this this logic
//wishme luck...+i commented out the original beraly working one to have a standing point if i ever mess up
//this reminds me of my swing working....not so fun
 import "../styles/info.css"
  import { useNavigate } from "react-router-dom";
import {validateProfile } from "../assets/components/Validations.js";
import { useState } from "react";
import { useEffect } from "react";
import { useRegistration } from "../assets/components/Context.jsx";







export default function Info() {
  

  // handllers to be updated while user fills the form*/
  const [fullName, setFullName] = useState("");
const [birthDate, setBirthDate] = useState("");
const [email, setEmail] = useState("");
const [university, setUniversity] = useState({ code: "", name: "" });
const [role, setRole] = useState("");


  //context is the kinda freindly replace of localstorage
  //anything but an actual databse for now
  const { setProfile } = useRegistration();
 
const navigate = useNavigate();
//me finds that the current/old select isnt working fine for my perfectionest ass
//me wants to change it
//variables i wuld need
const [availableMajors, setAvailableMajors] = useState([]);
const [majors, setMajors] = useState([]);
const [customMajor, setCustomMajor] = useState("");
//that damn input does not want to disapear....i'll force it to...
//my bad...react concider a lenght of 0 and elemnt so it was showing...funny how in l1 i hated bolean and ternery elemnts but now i use them more then anything
//and nafie saw them in a code and said this isnt our working....i knew i shouldnt bother with sad....
const [isOtherMajor, setIsOtherMajor] = useState(false);



//effect that gets stred data and allows update:
useEffect(() => {
  const defaultMajors = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Process Engineering",
    "Architecture",
    "Natural and Life Science",
    "Agronomy",
    "Renewable Energies",
    "Geology",
    "Medicine",
    "Pharmacy",
    "Dental Medicine",
    "Veterinary Medicine",
    "Law",
    "Political Science & International Relations",
    "Economics & Commerce & Management Science",
    "History",
    "Psychology",
    "Sociology",
    "Philosophy",
    "Literature & Languages",
    "Information & Communucation Science",
    "Sport Science & Physical Education",
    "Art & Design"
  ];
  //hummm...i deleted the data when i added a new non existing major...fuck...fixing
  // Get stored majors, if any
  const stored = JSON.parse(localStorage.getItem("majors")) || [];

  // Merge without duplicates
  const mergedMajors = [...new Set([...defaultMajors, ...stored])];
  setAvailableMajors(stored);
   localStorage.setItem("majors", JSON.stringify(mergedMajors));
}, []);



//reset the select when changing the role.....
useEffect(() => {
  setMajors([]);
  setCustomMajor("");
}, [role]);
//..............email should also be unique........damn....how do i keep forgetting about this stuff?

const [error, setError] = useState("");

// form submit handler*/
const handleSubmit = (e) => {
  
  e.preventDefault();
  const users = JSON.parse(localStorage.getItem("users")) ||JSON.parse(localStorage.getItem("user")) || [];

const emailExists = users.some(
  (u) => u.email === email
);

if (emailExists) {
  setError("Email Already Exists...Login-in Instead?");
  alert("Email Already Exists...Login-in Instead?");
  return;
}

//back to update the submitter with new data...i have no idea how much things this is breaking...
let finalMajors = majors;

// if user typed a custom major(aka other)
if (customMajor.trim()) {
  finalMajors = [customMajor.trim()];
}

if (customMajor.trim()) {
  const storedMajors = JSON.parse(localStorage.getItem("majors")) || [];

  if (!storedMajors.includes(customMajor.trim())) {
    const updatedMajors = [...storedMajors, customMajor.trim()];
    localStorage.setItem("majors", JSON.stringify(updatedMajors));
    setAvailableMajors(updatedMajors);
  }
}
//soooo....dev tool manupilation precaution ...am i paranoid at this point?
if (role === "student" && finalMajors.length !== 1) {
  alert("Students must select exactly one major.");
  return;
}

if (role === "professor" && finalMajors.length < 1) {
  alert("Professors must select at least one major.");
  return;
}


  const profile = {
    fullName,
    birthDate,
    email,
    university,
    role,
    majors:finalMajors
  };

  const result = validateProfile(profile);

  if (!result.valid) {
    alert(result.error);
    return;
  }




  // Save to localStorage.....i need to abandon the local storage at some point....that is SAD....
  // localStorage.setItem("user", JSON.stringify(profile));
  //use context instead
  setProfile(profile);


  // Navigate to next page
  navigate("/register");//i think i did this twice?.....i'll fix it later....fixed
};


      

    return (
        <div id="body1">
             <form  onSubmit={handleSubmit} id="indexForm">{/*<!--action="register.html"   i think this is useless since i added the js redirection--> */}
        <fieldset id="field1" className="fieldInfo" >
           
             <legend id="legend1">Make Your Account</legend>
             <h3 id="h3">All Information Is Required</h3>

             <fieldset id="field2">
  
              <legend id="legend2">Personal Info</legend>
              <label htmlFor="name" >Full Name:</label>
              <br/>
              <input type="text" className="name" id="name" required minLength="5" name="fullName" placeholder="Ex:Hannibal Lecter"  onChange={(e) => setFullName(e.target.value)}/>
              <br/><br/>
              <label htmlFor="birth" >Your Date Of Birth:</label>
              <br/>
              <input type="date" id="birth"  className="birth" name="dateOfBirth" required onChange={(e) => setBirthDate(e.target.value)}/>
              <br/><br/>
              <label htmlFor="email" id="PEmail" >Your Professional Email:</label>
              <br/>
             <input type="email" className="PEmail" id="email" name="email" placeholder="something@something.something" required onChange={(e) => setEmail(e.target.value)}/>
             <br />
             {/* in hopes this works to fix the email uniqueness...is that a word?...couldnt care less...yeah it workes....for now */}
             {/* {error && (
              <p style={{ color: "#fc0c0ce9", marginTop: "10px",fontSize:"20px",backgroundColor:"#f7f4f4a7", borderRadius: "12px", width:"70%", marginLeft:"15%", height:" 30px" }}>
    {error}
  </p> )}*/}
  {/* that works....works completly fine but for the sake of my testing...i should nake it an alert..atleast for now */}
             
              <br/><br/>
              <label htmlFor="university" >Your University :</label>
              <br/>
              <select name="university" id="univ" className="univ" required  defaultValue="" value={university.code}
  onChange={(e) =>
    e.target.value === "other"
      ? setUniversity({ code: null, name: "" })
      : setUniversity({ code: e.target.value, name: "" })
  }>
                <option value="" disabled > </option>
                <option value="A1">University Of Algiers 1- Benyoucef Benkhedda</option>
                <option value="A2">University Of Algiers 2- Abou El Kacem Saadallah</option>
                <option value="A3">University Of Algiers 3- Dely Ibrahim</option>
                <option value="USTHB">University Of Science And Thechnology Houari Boumediene</option>
                <option value="ENP">National polytechnic School Of Algiers </option>
                <option value="ESNA">National Higher School of Agronomy </option>
                <option value="NHV">National Higher Veterinary School</option>
                <option value="BMU">Badji Mokhtar University-Annaba</option>
                <option value="UB1">University Of Batna 1</option>
                <option value="UB2">University Of Batna 2</option>
                <option value="UBj">University Of Bejaia</option>
                <option value="UBs">University Of Beskra Mohamed Khider Biskra</option>
                <option value="UBl1">University Of Blida 1-Saad Dahlab</option>
                <option value="Ubl2">University Of Blida 2-Ali Lounici</option>
                <option value="UCh">University Of Chlef-Hassiba benbouali</option>
                <option value="UC1">University Of Costantine 1-Mentouri Brothers</option>
                <option value="UC2">University Of Costantine 2-Abdelhamid Mehri </option>
                <option value="UC3">University Of Costantine 3-Salah boubnider</option>
                <option value="UD">University of Djelfa - Ziane Achour </option>
                <option value="UG">​University of Guelma - 8 May 1945</option>
                <option value="UJ">University of Jijel </option>
                <option value="UL">University of Laghouat - Amar Telidji</option>
                <option value="UM">​University of Mostaganem - Abdelhamid Ibn Badis  </option>
                <option value="UMs">University of M'Sila - Mohamed Boudiaf  </option>
                <option value="UO1">University of Oran 1 - Ahmed Ben Bella </option>
                <option value="UO2">​University of Oran 2 - Mohamed Ben Ahmed </option>
                <option value="USTO">University of Science and Technology of Oran - Mohamed Boudiaf</option>
                <option value="UOr">University of Ouargla - Kasdi Merbah</option>
                <option value="USa">​University of Saida - Dr. Moulay Tahar </option>
                <option value="USBA">​Djillali Liabes University of Sidi Bel Abbes  </option>
                <option value="USk">University of Skikda - 20 August 1955 </option>
                <option value="USA">​University of Souk Ahras - Mohamed Cherif Messaadia  </option>
                <option value="US1">University of Setif 1 - Ferhat Abbas </option>
                <option value="US2">University of Setif 2</option>
                <option value="UTi">University of Tiaret - Ibn Khaldoun</option>
                <option value="UTl">​University of Tlemcen - Abou Bekr Belkaid</option>
                <option value="UTO">​University of Tizi Ouzou - Mouloud Mammeri</option>
                <option value="other">Other</option>



              </select>
              <br/><br/>
             {university.code === null && (
  <input
    type="text"
    className="other"
    placeholder="Enter university name"
    onChange={(e) =>
      setUniversity({ code: null, name: e.target.value })
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
                
               <select
               id="professorselect"
  className="major"
  multiple={role === "professor"}
  value={majors}
  onChange={(e) => {
    const values = [...e.target.selectedOptions].map(o => o.value);

   if (values.includes("OTHER")) {
  setIsOtherMajor(true);
  setMajors(["OTHER"]);
} else {
  setIsOtherMajor(false);
  setMajors(values);
  setCustomMajor("");
}
  }}
  required
> <option value="" disabled></option>
  {availableMajors.map((m) => (
    <option key={m} value={m}>{m}</option>
  ))}
  <option value="OTHER">Other</option>
</select><br /><br />
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
           <a href="#" id="InfoLink" onClick={() => navigate("/login")}>
              Already Have An Account?
            </a>
        </fieldset>
    
     </form>
        <div className="bg1"></div>
        </div>
    );}