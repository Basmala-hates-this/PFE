//i had the brigth idea to make a check list inside every script to not forget what i should add or do...better late then never ig...
//Live Counter Updates
//Recent Activity Feed
//Theme Toggle (Dark/Light Mode)
//Logout Confirmation
//Profile Preview on Hover
//Settings Panel Toggle:
//=>Instead of navigating away, let “Settings” open a slide-in panel with options like:Change theme/Update profile/Notification preferences
//Maybe add confetti to be activated on milestons????like 100 followers or something...
//Interactive Sidebar Navigation:
//=>Let the sidebar expand/collapse with a toggle button. Add smooth transitions and icon animations for flair
//Mini Modal for Profile Preview:
//=>Clicking “Profile” opens a modal with avatar, bio, and quick stats. 
//Search Bar with Filter:
//=>Add a search bar that filters recent activity items as the user types. 

 
    /*************************************************************************
     * BFUA — Front-end-only Q&A v1
     * Behavior:
     * - Clicking the "Q&A" sidebar item shows the Q&A section and hides the default content.
     * - Q&A state (questions & answers) is stored in JS memory (arrays). It persists while the page is open
     *   and while switching between Home and Q&A (no reload).
     * - Each question: { id, title, body, createdAt, answers: [ {id, body, createdAt} ] }
     *
     * Notes:
     * - This is intentionally simple: no auth, no backend. Author is "You" by default.
     * - Comments are included so you can follow each step.
     **************************************************************************/

    // --- Simple in-memory store ---
 // ===============================
// 🧠 Data Store for Questions & Answers
// ===============================
const store = {
  questions: [],           // Array to hold all posted questions
  nextQuestionId: 1,       // Unique ID counter for questions
  nextAnswerId: 1          // Unique ID counter for answers
};

// ===============================
// 📦 DOM Element References
// ===============================
const homeLink = document.getElementById("home-link");           // Sidebar link to Home
const qaLink = document.getElementById("qa-link");               // Sidebar link to Q&A
const defaultContent = document.getElementById("default-content"); // Home content container
const qnaSection = document.getElementById("qna-section");       // Q&A section container

const showFormBtn = document.getElementById("focus-ask");        // "Ask a Question" button
const questionForm = document.getElementById("ask-question-card"); // Ask Question form container
const postQuestionBtn = document.getElementById("post-question");  // Post Question button
const cancelQuestionBtn = document.getElementById("cancel-question"); // Cancel button in form

const questionTitleInput = document.getElementById("question-title"); // Input for question title
const questionBodyInput = document.getElementById("question-body");   // Textarea for question body
const questionsList = document.getElementById("questions-list");      // Container for all question cards

const postsCard = document.getElementById("posts-card");         // "Posts" section in Home stats

// ===============================
// ⏱️ Utility: Time Since Formatter
// ===============================
function timeSince(date) {
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ===============================
// 🔄 Section Switching Functions
// ===============================
function showHome() {
  defaultContent.style.display = "";         // Show Home content
  qnaSection.style.display = "none";         // Hide Q&A section
  homeLink.classList.add("active");          // Highlight Home link
  qaLink.classList.remove("active");         // Unhighlight Q&A link
}

function showQnA() {
  defaultContent.style.display = "none";     // Hide Home content
  qnaSection.style.display = "block";        // Show Q&A section
  homeLink.classList.remove("active");       // Unhighlight Home link
  qaLink.classList.add("active");            // Highlight Q&A link
}

// ===============================
// 🧭 Sidebar Navigation Events
// ===============================
homeLink.addEventListener("click", (e) => {
  e.preventDefault();
  showHome();
});

qaLink.addEventListener("click", (e) => {
  e.preventDefault();
  showQnA();
});

// ===============================
// ✍️ Ask Question Form Events
// ===============================
showFormBtn.addEventListener("click", () => {
  questionForm.classList.remove("hidden");   // Show the form
  questionTitleInput.focus();                // Focus on title input
});

cancelQuestionBtn.addEventListener("click", () => {
  questionForm.classList.add("hidden");      // Hide the form
  questionTitleInput.value = "";             // Clear title
  questionBodyInput.value = "";              // Clear body
});

// ===============================
// 📤 Post a New Question
// ===============================
postQuestionBtn.addEventListener("click", () => {
  const title = questionTitleInput.value.trim();
  const body = questionBodyInput.value.trim();

  if (!title || !body) {
    alert("Please fill in both title and description.");
    return;
  }

  // Create question object
  const q = {
    id: store.nextQuestionId++,
    title,
    body,
    createdAt: Date.now(),
    answers: []
  };

  store.questions.push(q); // Save question to store

  // Add title to Home "Posts" section
  const postTitle = document.createElement("div");
  postTitle.textContent = `• ${q.title}`;
  postsCard.appendChild(postTitle);

  // Reset form
  questionTitleInput.value = "";
  questionBodyInput.value = "";
  questionForm.classList.add("hidden");

  renderQuestions(); // Refresh Q&A list
});

// ===============================
// 🧱 Render All Questions
// ===============================
function renderQuestions() {
  questionsList.innerHTML = ""; // Clear existing list

  const list = store.questions.slice().reverse(); // Show newest first
  if (list.length === 0) {
    questionsList.innerHTML = `<div class="empty-state">No questions yet — be the first to ask!</div>`;
    return;
  }

  list.forEach(q => {
    const qCard = document.createElement("div");
    qCard.className = "question-card";
    qCard.dataset.qid = q.id;

    qCard.innerHTML = `
      <h3 class="question-title">${escapeHtml(q.title)}</h3>
      <div class="question-meta">Asked • ${timeSince(q.createdAt)}</div>
      <div class="question-body">${escapeHtml(q.body)}</div>

      <div class="meta-row">
        <span class="muted">${q.answers.length} Answers</span>
        <button class="btn" data-action="toggle-reply">Reply</button>
        <button class="btn" data-action="toggle-answers">View Answers</button>
      </div>

      <div class="answers hidden" data-answers-for="${q.id}"></div>

      <div class="answer-form hidden" data-form-for="${q.id}">
        <textarea placeholder="Write your answer..."></textarea>
        <div class="answer-actions">
          <button class="btn primary answer-post-btn">Post Answer</button>
          <button class="btn cancel-btn" data-action="cancel-reply">Cancel</button>
        </div>
      </div>
    `;

    questionsList.appendChild(qCard);
    renderAnswersForQuestion(q.id); // Render answers for this question
  });
}

// ===============================
// 💬 Render Answers for a Question
// ===============================
function renderAnswersForQuestion(qid) {
  const q = store.questions.find(x => x.id === qid);
  const container = questionsList.querySelector(`.answers[data-answers-for="${qid}"]`);
  if (!q || !container) return;

  container.innerHTML = "";
  if (q.answers.length === 0) {
    container.innerHTML = `<div class="empty-state">No answers yet — be the first to reply.</div>`;
    return;
  }

  q.answers.forEach(a => {
    const div = document.createElement("div");
    div.className = "answer";
    div.innerHTML = `
      <div>${escapeHtml(a.body)}</div>
      <div class="muted answered-time">Answered • ${timeSince(a.createdAt)}</div>
    `;
    container.appendChild(div);
  });
}

// ===============================
// 📨 Handle Posting an Answer
// ===============================
function handlePostAnswer(btn) {
  const qCard = btn.closest(".question-card");
  const qid = Number(qCard.dataset.qid);
  const textarea = qCard.querySelector(".answer-form textarea");
  const text = textarea.value.trim();

  if (!text) {
    alert("Please write something before posting.");
    return;
  }

  const answer = {
    id: store.nextAnswerId++,
    body: text,
    createdAt: Date.now()
  };

  const q = store.questions.find(x => x.id === qid);
  q.answers.push(answer);
  textarea.value = "";
  qCard.querySelector(".answer-form").classList.add("hidden");
  renderQuestions(); // Refresh list to show new answer
}

// ===============================
// 🧠 Event Delegation for Buttons
// ===============================
questionsList.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  const qCard = e.target.closest(".question-card");
  if (!qCard) return;
  const qid = Number(qCard.dataset.qid);

  if (!action) {
    if (e.target.classList.contains("answer-post-btn")) {
      handlePostAnswer(e.target);
    }
    return;
  }

  if (action === "toggle-reply") {
    qCard.querySelector(`.answer-form[data-form-for="${qid}"]`).classList.toggle("hidden");
    qCard.querySelector(`.answers[data-answers-for="${qid}"]`).classList.remove("hidden");
  } else if (action === "toggle-answers") {
    qCard.querySelector(`.answers[data-answers-for="${qid}"]`).classList.toggle("hidden");
  } else if (action === "cancel-reply") {
    qCard.querySelector(`.answer-form[data-form-for="${qid}"]`).classList.add("hidden");
  }
});

// ===============================
// 🔐 Escape HTML to Prevent Injection
// ===============================
// ===============================
// 🔐 Escape HTML to Prevent Injection
// ===============================
// This function replaces special characters with safe HTML entities
// to prevent malicious code from being injected into the page.
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br/>"); // Preserve line breaks
}
// ===============================
// 🚀 Init: Run on Page Load
// ===============================
(function init() {
  showHome();                          // Start on Home view
  questionForm.classList.add("hidden"); // Hide Ask Question form initially
  renderQuestions();                   // Render any existing questions (empty at first)

  // UX: Press Enter in title field moves to body field
  questionTitleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      questionBodyInput.focus();
    }
  });

  // UX: Ctrl + Enter in answer textarea submits the answer
  questionsList.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" && e.ctrlKey && e.key === "Enter") {
      const qCard = e.target.closest(".question-card");
      const btn = qCard && qCard.querySelector(".answer-post-btn");
      if (btn) btn.click();
    }
  });
})();


  





