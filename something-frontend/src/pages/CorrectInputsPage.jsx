import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { customSelect } from "../assets/components/selectStyles";
 import { useTranslation } from 'react-i18next';
import api from "../api/axios.js";


export default function CorrectInputsPage() {
  const navigate = useNavigate(); 
  
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [loading, setLoading] = useState(false);

  // figure out what needs correction
  const hasCustomUni = currentUser?.needsUniCorrection;
  const hasCustomMajors = currentUser?.needsMajorCorrection;

  const isProfessor = currentUser?.role === "professor";

const { t } = useTranslation();

const [availableUniversities, setAvailableUniversities] = useState([]);
const [availableMajors, setAvailableMajors] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    try {
      // const [uniRes, majorRes] = await Promise.all([
      //   axios.get("http://localhost:5000/api/auth/universities"),
      //   axios.get("http://localhost:5000/api/auth/majors")
      // ]);
      const [uniRes, majorRes] = await Promise.all([
  api.get("/auth/universities"),
  api.get("/auth/majors")
]);
      setAvailableUniversities(uniRes.data);
      setAvailableMajors(majorRes.data);
    } catch (err) {
      console.error("Failed to fetch universities/majors:", err);
    }
  };
  fetchData();
}, []);

  useEffect(() => {
    if (currentUser?.otherInputStatus !== "rejected") {
      navigate("/dashboard");
    }
  }, []);

const uniOptions = availableUniversities.map((u) => ({
  value: u.code,
  label: u.name,
  uni: u,
}));
const majorOptions = availableMajors.map((m) => ({ value: m, label: m }));


  const handleSubmit = async () => {
    // console.log("handleSubmit fired");
    // console.log("hasCustomUni:", hasCustomUni);
    // console.log("hasCustomMajors:", hasCustomMajors);
    // console.log("selectedUniversity:", selectedUniversity);
    // console.log("selectedMajors:", selectedMajors);
    // console.log("currentUser:", currentUser);

    if (hasCustomUni && !selectedUniversity)
      return alert(t("correction.noUniError"))
    if (hasCustomMajors && selectedMajors.length === 0)
      return alert(t("correction.noMajorError"))

    setLoading(true);
    try {
    const res = await api.post(
  "/users/select-valid-inputs",
  {
    selectedUniversityCode: hasCustomUni
      ? selectedUniversity.value
      : null,
    selectedMajorNames: hasCustomMajors
      ? selectedMajors.map((m) => m.value)
      : null,
  }
);
      // use fresh data from backend instead of building it manually
      localStorage.setItem("currentUser", JSON.stringify(res.data.user));

     alert(t("correction.successMessage"))
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1f35",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#252b45",
          borderRadius: "12px",
          padding: "32px",
          width: "100%",
          maxWidth: "520px",
        }}
      >
        <h2 style={{ margin: "0 0 8px" }}>{t("correction.title")}</h2>
        <p style={{ opacity: 0.6, marginBottom: "24px", fontSize: "14px" }}>
          {t("correction.subtitle")}
        </p>

        {/* university section */}
        {hasCustomUni && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(231,76,60,0.15)",
                border: "1px solid rgba(231,76,60,0.3)",
                marginBottom: "12px",
              }}
            >
              <small style={{ color: "#e74c3c" }}>
                {t("correction.rejectedUni")}
              </small>
              <p style={{ margin: "4px 0 0", fontSize: "14px" }}>
                {currentUser?.universityName}
              </p>
            </div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                opacity: 0.8,
              }}
            >
              {t("correction.selectUniLabel")}
            </label>
            <Select
              options={uniOptions}
              value={selectedUniversity}
              onChange={setSelectedUniversity}
              placeholder={t("correction.selectUniPlaceholder")}
              styles={customSelect}
            />
          </div>
        )}

        {/* majors section */}
        {hasCustomMajors && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(231,76,60,0.15)",
                border: "1px solid rgba(231,76,60,0.3)",
                marginBottom: "12px",
              }}
            >
              <small style={{ color: "#e74c3c" }}>{t("correction.rejectedMajors")}</small>
              {/* {currentUser?.majors?.filter(m => !DEFAULT_MAJORS.includes(m)).map((m, i) => (
                <p key={i} style={{ margin: "4px 0 0", fontSize: "14px" }}>{m}</p>
              ))} */}
              <p style={{ margin: "4px 0 0", fontSize: "14px", opacity: 0.7 }}>
                {t("correction.rejectedMajorsNote")}
              </p>
            </div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                opacity: 0.8,
              }}
            >
             {isProfessor ? t("correction.selectMajorLabelProf") : t("correction.selectMajorLabelStudent")}
            </label>
            <Select
              options={majorOptions}
              value={selectedMajors}
              onChange={
                isProfessor
                  ? setSelectedMajors
                  : (val) => setSelectedMajors(val ? [val] : [])
              }
              isMulti={isProfessor}
              placeholder={t("correction.selectMajorPlaceholder")}
              styles={customSelect}
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            background: "#6476af",
            border: "none",
            color: "white",
            fontSize: "15px",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? t("correction.saving") : t("correction.confirm")}
        </button>
      </div>
    </div>
  );
}
 