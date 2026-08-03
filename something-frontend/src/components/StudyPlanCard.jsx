import { useState, useEffect } from "react";
import api from "../api/axios.js";
import "./StudyPlan.css";


export default function StudyPlanCard({ planId }) {
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/ai/study-plan/${planId}`);
        if (!cancelled) { setPlan(res.data.plan); setTasks(res.data.tasks); }
      } catch (err) {
        console.error("Failed to load study plan:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [planId]);

  const toggleTask = async (taskId, completed) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed } : t)); // optimistic
    try {
      await api.patch(`/ai/study-plan/tasks/${taskId}`, { completed });
    } catch (err) {
      console.error("Failed to toggle task:", err);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !completed } : t)); // revert
    }
  };

  if (loading) return <div className="study-plan-card study-plan-card-loading">Loading study plan...</div>;
  if (error || !plan) return <div className="study-plan-card study-plan-card-error">This study plan couldn't be found — it may have been deleted.</div>;

  const doneCount = tasks.filter(t => t.completed).length;
  const visibleTasks = expanded ? tasks : tasks.slice(0, 3);

  return (
    <div className="study-plan-card">
      <div className="study-plan-card-header">
        <strong>📅 {plan.subject}</strong>
        <span className="study-plan-progress">{doneCount}/{tasks.length} done</span>
      </div>
      <small className="study-plan-deadline">Due {new Date(plan.deadline).toLocaleDateString()}</small>

      <ul className="study-plan-task-list">
        {visibleTasks.map(task => (
          <li key={task.id} className={task.completed ? "study-plan-task-done" : ""}>
            <label>
              <input type="checkbox" checked={task.completed} onChange={e => toggleTask(task.id, e.target.checked)} />
              <span className="study-plan-task-day">Day {task.dayIndex}</span> — {task.title}
            </label>
            {task.description && <p className="study-plan-task-desc">{task.description}</p>}
          </li>
        ))}
      </ul>

      {tasks.length > 3 && (
        <button className="study-plan-toggle-expand" onClick={() => setExpanded(p => !p)}>
          {expanded ? "Show less" : `Show all ${tasks.length} days`}
        </button>
      )}
    </div>
  );
}