// Post a new question
//useless for now,until i'm back to this logic
postQuestionBtn.addEventListener("click", () => {
  const title = document.getElementById("question-title").value.trim();
  const description = document.getElementById("question-description").value.trim();

  if (!title || !description) {
    alert("Please fill in both title and description!");
    return;
  }

  const questionCard = document.createElement("div");
  questionCard.classList.add("question-card");

  questionCard.innerHTML = `
    <h3>${title}</h3>
    <p>${description}</p>

    <div class="answers-section">
      <h4>Answers (<span class="answer-count">0</span>):</h4>
      <div class="answers"></div>

      <div class="answer-form">
        <textarea placeholder="Write your answer..."></textarea>
        <div class="form-actions">
          <button class="theme-btn post-answer">Post Answer</button>
          <button class="cancel-btn cancel-answer">Cancel</button>
        </div>
      </div>
    </div>
  `;

  questionsList.prepend(questionCard);
  attachAnswerEvents(questionCard);

  clearForm();
  questionForm.style.display = "none";
  showFormBtn.style.display = "inline-block";
});

// Handle posting and canceling answers inside a question card
function attachAnswerEvents(card) {
  const postAnswerBtn = card.querySelector(".post-answer");
  const cancelAnswerBtn = card.querySelector(".cancel-answer");
  const textarea = card.querySelector(".answer-form textarea");
  const answersContainer = card.querySelector(".answers");
  const answerCount = card.querySelector(".answer-count");

  postAnswerBtn.addEventListener("click", () => {
    const answerText = textarea.value.trim();
    if (!answerText) return;

    const newAnswer = document.createElement("div");
    newAnswer.classList.add("answer");
    newAnswer.textContent = answerText;

    answersContainer.appendChild(newAnswer);
    textarea.value = "";

    //  Update the counter
    const currentCount = answersContainer.querySelectorAll(".answer").length;
    answerCount.textContent = currentCount;
  });

  cancelAnswerBtn.addEventListener("click", () => {
    textarea.value = "";
  });
}

//this was supposed to be and have the entire logic of posting and comenting.it was for the old dashboard.
//now that the dashboard had changed,and will probably change again.
//i dont see a point in having this,
//but it could also be usefull when i get back to this logic.
//so i'll be keeping it in the scripts folder for leter when the project is over 