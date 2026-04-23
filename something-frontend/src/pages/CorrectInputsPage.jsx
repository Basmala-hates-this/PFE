import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { customSelect } from "../assets/components/selectStyles";

const DEFAULT_UNIVERSITIES = [
  { code: "UA1", name: "University Of Algiers 1- Benyoucef Benkhedda" },
  { code: "UA2", name: "University Of Algiers 2- Abou El Kacem Saadallah" },
  { code: "UA3", name: "University Of Algiers 3- Dely Ibrahim" },
  { code: "USTHB", name: "University Of Science And Technology Houari Boumediene" },
  { code: "ENP", name: "National Polytechnic School Of Algiers" },
  { code: "ESNA", name: "National Higher School of Agronomy" },
  { code: "NHV", name: "National Higher Veterinary School" },
  { code: "BMU", name: "Badji Mokhtar University-Annaba" },
  { code: "UB1", name: "University Of Batna 1" },
  { code: "UB2", name: "University Of Batna 2" },
  { code: "UBj", name: "University Of Bejaia" },
  { code: "UBs", name: "University Of Biskra Mohamed Khider" },
  { code: "UBl1", name: "University Of Blida 1-Saad Dahlab" },
  { code: "Ubl2", name: "University Of Blida 2-Ali Lounici" },
  { code: "UCh", name: "University Of Chlef-Hassiba Benbouali" },
  { code: "UC1", name: "University Of Constantine 1-Mentouri Brothers" },
  { code: "UC2", name: "University Of Constantine 2-Abdelhamid Mehri" },
  { code: "UC3", name: "University Of Constantine 3-Salah Boubnider" },
  { code: "UD", name: "University of Djelfa - Ziane Achour" },
  { code: "UG", name: "University of Guelma - 8 May 1945" },
  { code: "UJ", name: "University of Jijel" },
  { code: "UL", name: "University of Laghouat - Amar Telidji" },
  { code: "UM", name: "University of Mostaganem - Abdelhamid Ibn Badis" },
  { code: "UMs", name: "University of M'Sila - Mohamed Boudiaf" },
  { code: "UO1", name: "University of Oran 1 - Ahmed Ben Bella" },
  { code: "UO2", name: "University of Oran 2 - Mohamed Ben Ahmed" },
  { code: "USTO", name: "University of Science and Technology of Oran - Mohamed Boudiaf" },
  { code: "UOr", name: "University of Ouargla - Kasdi Merbah" },
  { code: "USa", name: "University of Saida - Dr. Moulay Tahar" },
  { code: "USBA", name: "Djillali Liabes University of Sidi Bel Abbes" },
  { code: "USk", name: "University of Skikda - 20 August 1955" },
  { code: "USA", name: "University of Souk Ahras - Mohamed Cherif Messaadia" },
  { code: "US1", name: "University of Setif 1 - Ferhat Abbas" },
  { code: "US2", name: "University of Setif 2" },
  { code: "UTi", name: "University of Tiaret - Ibn Khaldoun" },
  { code: "UTl", name: "University of Tlemcen - Abou Bekr Belkaid" },
  { code: "UTO", name: "University of Tizi Ouzou - Mouloud Mammeri" },
];

const DEFAULT_MAJORS = [
  "Computer Science","Mathematics","Physics","Chemistry","Biology",
  "Civil Engineering","Mechanical Engineering","Electrical Engineering",
  "Process Engineering","Architecture","Natural and Life Science","Agronomy",
  "Renewable Energies","Geology","Medicine","Pharmacy","Dental Medicine",
  "Veterinary Medicine","Law","Political Science & International Relations",
  "Economics & Commerce & Management Science","History","Psychology",
  "Sociology","Philosophy","Literature & Languages",
  "Information & Communucation Science","Sport Science & Physical Education",
  "Art & Design"
];
 
export default function CorrectInputsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [loading, setLoading] = useState(false);

  // figure out what needs correction
  const hasCustomUni = currentUser?.universityCode &&
  !DEFAULT_UNIVERSITIES.find(u => u.code === currentUser.universityCode);

const hasCustomMajors = currentUser?.majors?.some(m => !DEFAULT_MAJORS.includes(m));
  const isProfessor = currentUser?.role === "professor";

  useEffect(() => {
    if (currentUser?.otherInputStatus !== "rejected") {
      navigate("/dashboard");
    }
  }, []);

  const uniOptions = DEFAULT_UNIVERSITIES.map(u => ({ value: u.code, label: u.name, uni: u }));
  const majorOptions = DEFAULT_MAJORS.map(m => ({ value: m, label: m }));

const handleSubmit = async () => {
  if (hasCustomUni && !selectedUniversity) return alert("Please select a valid university.");
  if (hasCustomMajors && selectedMajors.length === 0) return alert("Please select at least one valid major.");

  setLoading(true);
  try {
    const res = await axios.post(
      "http://localhost:5000/api/users/select-valid-inputs",
      {
        selectedUniversityCode: hasCustomUni ? selectedUniversity.value : null,
        selectedMajorNames: hasCustomMajors ? selectedMajors.map(m => m.value) : null,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // use fresh data from backend instead of building it manually
    localStorage.setItem("currentUser", JSON.stringify(res.data.user));

    alert("Information updated successfully!");
    navigate("/dashboard");
  } catch (err) {
    alert(err.response?.data?.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
};            

  return (
    <div style={{
      minHeight: "100vh", background: "#1a1f35", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div style={{
        background: "#252b45", borderRadius: "12px", padding: "32px",
        width: "100%", maxWidth: "520px"
      }}>
        <h2 style={{ margin: "0 0 8px" }}>Update Your Information ✏️</h2>
        <p style={{ opacity: 0.6, marginBottom: "24px", fontSize: "14px" }}>
          Some of the information you provided during registration was not recognized.
          Please select valid options from the lists below to continue.
        </p>

        {/* university section */}
        {hasCustomUni && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              padding: "10px 14px", borderRadius: "8px",
              background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)",
              marginBottom: "12px"
            }}>
              <small style={{ color: "#e74c3c" }}>❌ Rejected university:</small>
              <p style={{ margin: "4px 0 0", fontSize: "14px" }}>{currentUser?.university?.name}</p>
            </div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", opacity: 0.8 }}>
              Select your university:
            </label>
            <Select
              options={uniOptions}
              value={selectedUniversity}
              onChange={setSelectedUniversity}
              placeholder="Select a university..."
              styles={customSelect}
            />
          </div>
        )}

        {/* majors section */}
        {hasCustomMajors && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              padding: "10px 14px", borderRadius: "8px",
              background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)",
              marginBottom: "12px"
            }}>
              <small style={{ color: "#e74c3c" }}>❌ Rejected major(s):</small>
              {currentUser?.majors?.filter(m => !DEFAULT_MAJORS.includes(m)).map((m, i) => (
                <p key={i} style={{ margin: "4px 0 0", fontSize: "14px" }}>{m}</p>
              ))}
            </div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", opacity: 0.8 }}>
              Select {isProfessor ? "your major(s):" : "your major (one only):"}
            </label>
            <Select
              options={majorOptions}
              value={selectedMajors}
              onChange={setSelectedMajors}
              isMulti={isProfessor}
              placeholder="Select major(s)..."
              styles={customSelect}
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "12px", borderRadius: "8px",
            background: "#6476af", border: "none", color: "white",
            fontSize: "15px", cursor: "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Saving..." : "Confirm & Continue"}
        </button>
      </div>
    </div>
  );
}