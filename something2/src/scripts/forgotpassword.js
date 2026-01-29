//i had the brigth idea to make a check list inside every script to not forget what i should add or do...better late then never ig...
//lets start simple by validating the email format(alrady have one that i can use in the index page)✅
//disable button until Email IS valid(i'm not doing all that just to get faulty email submeted)/✅
//add alerts of successor fail fo sending reset emails???????why do i want this again?isnt the confirmation going to be in the email sending????
//actualyy emplementing the sending of rest emails(although i think this is for the backend)
//OK NOW WHAT??????????
//


// \DOM References
const emailInput = document.getElementById('reset-email');
const submitBtn = document.getElementById('btn4');
const form = document.getElementById('reset-form');

// EMAIL FORMAT CHECKER 
// Checks for: something@something.something(dont ask ,i ran out of resonable ideas...)
function isValidEmail(email) {
     // ^ => Start of the string 
     // [^\s@]+ => One or more characters that are NOT whitespace or @
     // @ => is a damn @
     // \. => complicated way to say .
     // $ => End of the string
     // yeah REGEX is hella weird. but THL finally paid off, yeeey........
     // everything except @ or space + @"everything except @" or space + . + yet again everything except @ or space
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

//  LIVE VALIDATION 
// Disable button until email is valid
emailInput.addEventListener('input', () => {
  const trimmedEmail = emailInput.value.trim();
  submitBtn.disabled = !isValidEmail(trimmedEmail);
});

//  FORM SUBMISSION HANDLER 
form.addEventListener('submit', (e) => {
  e.preventDefault(); // Stop default form submission

  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    alert("Please enter a valid email address.");
    return;
  }


 
   window.location.href = "resetPassword.html"; //  redirect to password reset(no shit sherlock...i need help )
});

