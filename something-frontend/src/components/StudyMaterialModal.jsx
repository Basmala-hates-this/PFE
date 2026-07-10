import { useState } from "react";
import "../styles/studyMaterial.css";

export default function StudyMaterialModal({ material, onClose }) {
  if (!material) return null;
  const { type, content } = material;

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={e => e.stopPropagation()}>
        <button className="sm-close" onClick={onClose}>✕</button>
        {type === "summary" && <SummaryView content={content} />}
        {type === "flashcards" && <FlashcardsView content={content} />}
        {type === "quiz" && <QuizView content={content} />}
      </div>
    </div>
  );
}

function SummaryView({ content }) {
  return (
    <div className="sm-summary">
      <h2>{content.title || "Summary"}</h2>
      <ul>
        {content.points?.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    </div>
  );
}

function FlashcardsView({ content }) {
  const cards = content.cards || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return <p>No flashcards generated.</p>;
  const card = cards[index];

  const next = () => { setFlipped(false); setIndex(i => Math.min(i + 1, cards.length - 1)); };
  const prev = () => { setFlipped(false); setIndex(i => Math.max(i - 1, 0)); };

  return (
    <div className="sm-flashcards">
      <p className="sm-counter">{index + 1} / {cards.length}</p>
      <div className={`sm-flip-card ${flipped ? "sm-flipped" : ""}`} onClick={() => setFlipped(f => !f)}>
        <div className="sm-flip-inner">
          <div className="sm-flip-front">{card.front}</div>
          <div className="sm-flip-back">{card.back}</div>
        </div>
      </div>
      <p className="sm-hint">Click card to flip</p>
      <div className="sm-nav">
        <button onClick={prev} disabled={index === 0}>◀ Prev</button>
        <button onClick={next} disabled={index === cards.length - 1}>Next ▶</button>
      </div>
    </div>
  );
}

function QuizView({ content }) {
  const questions = content.questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const select = (qIndex, optIndex) => {
    if (submitted) return;
    setAnswers(a => ({ ...a, [qIndex]: optIndex }));
  };

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);

  return (
    <div className="sm-quiz">
      {questions.map((q, qi) => (
        <div key={qi} className="sm-question">
          <p className="sm-question-text">{qi + 1}. {q.question}</p>
          <div className="sm-options">
            {q.options.map((opt, oi) => {
              const isSelected = answers[qi] === oi;
              const isCorrect = submitted && oi === q.correctIndex;
              const isWrong = submitted && isSelected && oi !== q.correctIndex;
              return (
                <button
                  key={oi}
                  className={`sm-option ${isSelected ? "sm-selected" : ""} ${isCorrect ? "sm-correct" : ""} ${isWrong ? "sm-wrong" : ""}`}
                  onClick={() => select(qi, oi)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button className="sm-submit" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}>
          Check Answers
        </button>
      ) : (
        <p className="sm-score">Score: {score} / {questions.length}</p>
      )}
    </div>
  );
}