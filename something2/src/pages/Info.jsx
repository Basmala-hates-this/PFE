 import "../styles/info.css"


export default function Info() {
    return (
        <div id="body1">
             <form  method="post" id="indexForm">{/*<!--action="register.html"   i think this is useless since i added the js redirection--> */}
        <fieldset id="field1">
           
             <legend id="legend1">Make Your Account</legend>
             <h3 id="h3">All Information Is Required</h3>

             <fieldset id="field2">
  
              <legend id="legend2">Personal Info</legend>
              <label htmlFor="name" >Full Name:</label>
              <br/>
              <input type="text" className="name" id="name" required minLength="5" name="fullName" placeholder="Ex:Hannibal Lecter" />
              <br/><br/>
              <label htmlFor="birth" >Your Date Of Birth:</label>
              <br/>
              <input type="date" id="birth"  className="birth" name="dateOfBirth" required />
              <br/><br/>
              <label htmlFor="email" id="PEmail">Your Professional Email:</label>
              <br/>
             <input type="email" className="PEmail" id="email" name="email" required />
              <br/><br/>
              <label htmlFor="university" >Your University :</label>
              <br/>
              <select name="university" id="univ" className="univ" required  defaultValue="">
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
                <option value="USBA">​Djillali Liabès University of Sidi Bel Abbes  </option>
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

              <label htmlFor="other1" className="other" id="other2">What is your University: </label><br/>
              <input type="text" id="other1" className="other"/>
           
              <br/><br/>
        
            </fieldset>
             <fieldset id="field3">
                
               <legend  id="legend2">Practical Info</legend>
                
               <label>Are You A:</label> 
               <input type="radio" id="student" name="role" value="student" className="student" required /> <label htmlFor="student">Student</label>
               <input type="radio" id="professor" name="role" value="professor" className="professor" required /> <label htmlFor="professor">Professor</label>
                <br/><br/>
                <label htmlFor="major" id="major">Your Main Major(s) :</label>
                <br/>
                <div id="s_select">
                <select name="studentMajor" className="major" id="studentselect" defaultValue="" >
                    <option value="" disabled ></option>
                    <option value="CS"> Computer Science</option>
                    <option value="Math">Mathematics</option>
                    <option value="phy">Physics</option>
                    <option value="chem">Chemistry</option>
                    <option value="bio">Biology</option>
                    <option value="CE">Civil Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="EE">Electrical Engineering</option>
                    <option value="Pe">Process Engineering</option>
                    <option value="Ar">Architecture</option>
                    <option value="NLS">Natural and Life Science</option>
                    <option value="Ag">Agronomy</option>
                    <option value="RE">Renewable Energies</option>
                    <option value="Geo">Geology</option>
                    <option value="Med">Medicine</option>
                    <option value="Ph">Pharmacy</option>
                    <option value="DM">Dental Medicine</option>
                    <option value="VM">Veterinary Medicine</option>
                    <option value="Law">Law</option>
                    <option value="PS">Political Science & International Relations</option>
                    <option value="Ec">Economics & Commerce & Management Science</option>
                    <option value="Hs">History</option>
                    <option value="Ps">psychology</option>
                    <option value="So">Sociology</option>
                    <option value="Phil">Philosophy</option>
                    <option value="LL">Literature & Languages</option>
                    <option value="ICS">Information & Communucation Science</option>
                    <option value="SSP">Sport Science & Physical Education</option>
                    <option value="AD">Art & Design</option>
                </select>
                </div>
                <br/>
                <div id="p_select">
                <select name="profMajor" className="major" id="professorselect" multiple >
                  
                    <option value="CS"> Computer Science</option>
                    <option value="Math">Mathematics</option>
                    <option value="phy">Physics</option>
                    <option value="chem">Chemistry</option>
                    <option value="bio">Biology</option>
                    <option value="CE">Civil Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="EE">Electrical Engineering</option>
                    <option value="Pe">Process Engineering</option>
                    <option value="Ar">Architecture</option>
                    <option value="NLS">Natural and Life Science</option>
                    <option value="Ag">Agronomy</option>
                    <option value="RE">Renewable Energies</option>
                    <option value="Geo">Geology</option>
                    <option value="Med">Medicine</option>
                    <option value="Ph">Pharmacy</option>
                    <option value="DM">Dental Medicine</option>
                    <option value="VM">Veterinary Medicine</option>
                    <option value="Law">Law</option>
                    <option value="PS">Political Science & International Relations</option>
                    <option value="Ec">Economics & Commerce & Management Science</option>
                    <option value="Hs">History</option>
                    <option value="Ps">psychology</option>
                    <option value="So">Sociology</option>
                    <option value="Phil">Philosophy</option>
                    <option value="LL">Literature & Languages</option>
                    <option value="ICS">Information & Communucation Science</option>
                    <option value="SSP">Sport Science & Physical Education</option>
                    <option value="AD">Art & Design</option>
                </select>
                </div>
                <br/>
                {/* <!-- <small id="small">Hold on 'Ctrl' or 'Cmd' to have multiple choices</small> -->
                 */}
            </fieldset>
        
           <br/><br/>
           <input type="submit" value="Next" id="btn1" /> 
           <br/><br/>
           <a href="/login">
              Already Have An Account?
            </a>
        </fieldset>
    
     </form>
        <div className="bg1"></div>
        </div>
    );}