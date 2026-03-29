import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ReorientationPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [selectedMajor, setSelectedMajor] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // if no reorientation needed, redirect away
    if (!currentUser?.pendingReorientation) {
      navigate("/dashboard");
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedMajor) return alert("Please select a major.");
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/select-major",
        { selectedMajor },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // update currentUser in localStorage
      const updatedUser = {
        ...currentUser,
        majors: [selectedMajor],
        pendingReorientation: false
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      alert("Major selected! Welcome to StudyBuddy.");
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
        width: "100%", maxWidth: "480px"
      }}>
        <h2 style={{ margin: "0 0 8px" }}>One More Step 👋</h2>
        <p style={{ opacity: 0.6, marginBottom: "24px", fontSize: "14px" }}>
          Your professor status request was reviewed and your account has been set to student.
          Since you registered with multiple majors, please select the one major you'd like to continue with.
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
          {loading ? "Saving..." : "Confirm Major"}
        </button>
      </div>
    </div>
  );
}