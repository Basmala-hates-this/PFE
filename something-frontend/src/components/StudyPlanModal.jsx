import { useState } from "react";
import "../styles/studyPlan.css";

export default function StudyPlanModal({ onClose, onSubmit }) {
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    const pdfs = selected.filter(f => f.type === "application/pdf");
    setError(pdfs.length !== selected.length ? "Only PDFs are supported for resources right now." : null);
    setFiles(prev => [...prev, ...pdfs].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleSubmit = async () => {
    if (!subject.trim() || !deadline) return setError("Subject and deadline are required.");
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ subject: subject.trim(), deadline, files });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Couldn't create the study plan — try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content study-plan-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📅 Smart Study Plan</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <label className="study-plan-label">Subject / topic</label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Linear Algebra midterm"
          className="study-plan-input"
        />

        <label className="study-plan-label">Deadline</label>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="study-plan-input"
        />

        <label className="study-plan-label">Resources (optional, up to 5 PDFs)</label>
        <input type="file" accept="application/pdf" multiple onChange={handleFiles} />
        {files.length > 0 && (
          <ul className="study-plan-file-list">
            {files.map(f => (
              <li key={f.name}>📄 {f.name} <button onClick={() => removeFile(f.name)}>✕</button></li>
            ))}
          </ul>
        )}

        {error && <p className="study-plan-error">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting} className="study-plan-submit">
          {submitting ? "Generating plan..." : "Generate my plan"}
        </button>
      </div>
    </div>
  );
}