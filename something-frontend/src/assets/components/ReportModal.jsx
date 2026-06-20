import { useState } from "react";
import axios from "axios";
 import { useTranslation } from 'react-i18next';
// import i18n from '../i18n/index.js';
import api from "../../api/axios.js";


export default function ReportModal({ type, postId, commentId, targetId, onClose }) {
  const { t } = useTranslation();
const REASONS = [
  { key: "spam",          label: t("reportModal.reasons.spam") },
  { key: "harassment",    label: t("reportModal.reasons.harassment") },
  { key: "misinformation",label: t("reportModal.reasons.misinformation") },
  { key: "inappropriate", label: t("reportModal.reasons.inappropriate") },
  { key: "other",         label: t("reportModal.reasons.other") },
];

  const token = localStorage.getItem("token");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  

  const handleSubmit = async () => {
    if (!reason) return setError(t("reportModal.noReasonError"));
    try {
      if (type === "post") {
        // await axios.post(
        //   `http://localhost:5000/api/posts/${postId}/report`,
        //   { reason, details },
        //   { headers: { Authorization: `Bearer ${token}` } }
        // );
        await api.post(`/posts/${postId}/report`, { reason, details },{ headers: { Authorization: `Bearer ${token}` } });
      } else if (type === "comment") {
        // await axios.post(
        //   `http://localhost:5000/api/posts/${postId}/comments/${commentId}/report`,
        //   { reason, details },
        //   { headers: { Authorization: `Bearer ${token}` } }
        // );
        await api.post(`/posts/${postId}/comments/${commentId}/report`, { reason, details }, { headers: { Authorization: `Bearer ${token}` } });

      } else if (type === "user") {
        // await axios.post(
        //   `http://localhost:5000/api/users/${targetId}/report`,
        //   { reason, details },
        //   { headers: { Authorization: `Bearer ${token}` } }
        // );
        await api.post(`/users/${targetId}/report`, { reason, details }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}
        style={{ width: "380px", padding: "20px" }}>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p style={{ fontSize: "24px" }}>✅</p>
            <p>{t("reportModal.submitted")}</p>
            <button onClick={onClose}
              style={{ marginTop: "10px", padding: "8px 20px", borderRadius: "8px",
                background: "#6476af", border: "none", color: "white", cursor: "pointer" }}>
              {t("reportModal.close")}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>{`${t("reportModal.title")} ${type}`}</h3>
              <button onClick={onClose}
                style={{ background: "none", border: "none", fontSize: "20px",
                  cursor: "pointer", color: "white" }}>✕</button>
            </div>

            <p style={{ opacity: 0.6, fontSize: "13px", marginBottom: "12px" }}>
              {t("reportModal.selectReason")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              {REASONS.map(r => (
                <label key={r.key} style={{ display: "flex", alignItems: "center",
                  gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                  <input type="radio" name="reason" value={r.key}
                    checked={reason === r.key}
                    onChange={() => { setReason(r.key); setError(""); }} />
                  {r.label}
                </label>
              ))}
            </div>

            <textarea
              placeholder={t("reportModal.detailsPlaceholder")}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={{ width: "100%", minHeight: "70px", padding: "8px",
                borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)", color: "white",
                boxSizing: "border-box", resize: "vertical", marginBottom: "10px" }}
            />

            {error && <p style={{ color: "#fc0c0c", fontSize: "13px", marginBottom: "8px" }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={onClose}
                style={{ padding: "8px 16px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.1)", border: "none",
                  color: "white", cursor: "pointer" }}>
                {t("reportModal.cancel")}
              </button>
              <button onClick={handleSubmit} disabled={!reason}
                style={{ padding: "8px 16px", borderRadius: "8px",
                  background: "#c0392b", border: "none",
                  color: "white", cursor: "pointer" }}>
                {t("reportModal.submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}