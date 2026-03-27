//split => split the string into array of substrings
//join => join the array together to form a string

document.addEventListener("DOMContentLoaded", () => { // this is for:
// index.js:117 
// Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
// attachEventListeners @ index.js:117
// initializer @ index.js:14
// (anonymous) 
// /// thank me later

  const form = document.getElementById("indexForm");
  const birthDateInput = document.querySelector(".birth");
  const alreadyBtn = document.querySelector(".btn3");

  // --- INITIALIZER ---
  // This function sets up everything when the page loads
  function initializer() {
    setBirthDateLimit();      // Set the maximum allowed birth date
    attachEventListeners();   // Attach event listeners to form and button
  }

  // set the limit of the birthday (this is honestly the worst segment of the BFUA project so far, it keeps getting into problems)
  // basically check the existence of the element before using it
  //12/8/2025  ->this is bad because i think i overdid it....i'll rethink my life choices later
  //seriosly thoo....this checks for the exact time i cant find words..maybe i'll just make it look nicer?
  //noy like this projects entire code is clean to begin with 
  if (birthDateInput) {
    const today = new Date();
    const minAllowed = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    birthDateInput.max = minAllowed.toISOString().split("T")[0];
  }

  // --- 1. AGE LIMIT SETTER ---
  // Prevent users younger than 17 from selecting a birth date, i went overboard in this (selly me :))
  function setBirthDateLimit() {
    const today = new Date(); // Get today's date
    const minAllowed = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    // Convert date to YYYY-MM-DD format and set it as the max value
    // => convert the date to YYYY-MM-DDTHH:mm:ss.sssZ format where [0] is the YYYY-MM-DD part
    // it would split at 'T' because it separates the date from the time, duh.... :)
    birthDateInput.max = minAllowed.toISOString().split("T")[0];
  }

  // --- 2. AGE CHECKER ---
  // Check if the user is at least 17 years old
  function isOldEnough(dob) { // dob = date of birth
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear(); // Basic age calculation ,2-1=1
    const m = today.getMonth() - dob.getMonth();       // Check if birthday has passed this year
    // => example for my dull brain, if someone is born in January and the month is February m=2-1=1
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--; // This corrects the age if the birthday hasn't occurred yet this year:
             // m < 0: Birthday month is in the future.
             // m === 0 && today.getDate() < dob.getDate(): Same month, but birthday day is still ahead.
             // If either is true, subtract 1 from the rough age.
    }
    return age >= 17;
  }



  //the numbers are fucked because i keep adding js to this damn form...
  
  //so i'll try and add the select major dependency on either the user is a student or a prof.
  //lets hope if this might work out.(like any hopes i had before worked ,this will be hell )

  //i regret the day i chose to use choices.js...
  //i keep forgetting it creates its own elements....
  //bug:click student get student,click professor get professor ,click student again get both
  //fix: wrap the selects in divs and target those damn divs
  //hope it works

const stMajor = document.getElementById("studentselect");
const pfMajor = document.getElementById("professorselect");
const major = document.getElementById("major");
const student= document.getElementById("student");
const professor= document.getElementById("professor");
const S_Select=document.getElementById("s_select");
const P_Select=document.getElementById("p_select");
// const small=document.getElementById("small") ;

 student.addEventListener("change", () => {
  stMajor.style.display = "inline-block";
  pfMajor.style.display = "none";
  major.style.display = "inline-block";
  P_Select.style.display="none";
  S_Select.style.display="inline-block";
  
  // small.style.display="none";
});


let professorChoices;


professor.addEventListener("change", () => {
  P_Select.style.display="inline-block";
  S_Select.style.display="none";
  pfMajor.style.display = "inline-block";
  stMajor.style.display = "none";
  major.style.display = "inline-block";
  // small.style.display = "inline-block";
//this is the first use of Choices.js ,i hope this makes our life more easier :)
  if (!professorChoices) {
    professorChoices = new Choices('#professorselect', {
      removeItemButton: true,
      placeholderValue: ' ',
      searchEnabled: true,
      shouldSort: false
    });
  }
});

//funny how i plan to fix something then find myself doing something diffrent...sorry choice.js,u gonna have to wait 
//any how
//logic time: when the user cant find thier uni or something ,they choose other..simple enough right?
//except that we planned that each  uni will have its room..right?
//see the mix up and the bug yet?
//well, A TOOGLE ..input toogle to fill in your uni..if it exists..the the something will derect you to that room...if not ..then something will create it
//on to THE CODE
//ps:50% of the project is a monolog comments
const other=document.getElementById("univ");//this is the select..
const damn1=document.getElementById("other1");//this is the input
const damn2=document.getElementById("other2");//this is the label

//a rule in js...for buttons ->use click.  for select->use change
other.addEventListener("change", () => {
  const bruh = other.value;//for crying out loud ,i should not name it littleSomethingSomething//this is the value of the selected i think

  if (bruh === "other") {
    damn1.style.display = "inline-block";
    damn2.style.display = "inline-block";
  } 
});


//after all those fights with java swing and netbeans... i still hate javascript..but ig its easier to debug
//who fucking lied and said debugging js is easier?

  // --- 3. SAVE USER DATA ---
  
  function saveUserData(name, dob, email,uniSelection,role,majorValue) {
    const userData = {
      name: name,
      birthDate: dob.toISOString().split("T")[0], // Format date nicely
      email: email,
      uniSelection:uniSelection,
      role:role,
      major:majorValue

    };
    localStorage.setItem("BFUA_user", JSON.stringify(userData)); // Save as JSON string  
    // BFUA = Break-Fix until achieved
    // JSON = JavaScript Object Notation, kinda like STRUCT in C
    console.log("User data saved:", userData); // Log for debugging
    // to retrieve the data
    // const saved = JSON.parse(localStorage.getItem("BFUA_user"));
  }

  // --- EMAIL FORMAT CHECKER ---
  function isValidEmail(email) {
    // ^ => Start of the string
    // [^\s@]+ => One or more characters that are NOT whitespace or @
    // @ => is a damn @
    // \. => complicated way to say .
    // $ => End of the string
    // yeah REGEX is hella weird. but THL finally paid off, yeeey;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // everything except @ or space + @"everything except @" or space + . + yet again everything except @ or space
    return pattern.test(email);
  }



  
  // --- 4. HANDLE FORM SUBMISSION ---
  // Validate form and redirect to registration page
  // e represents an object that contains the information for that event only, most likely and hopefully temporary
  // this is a snippet of the FreeCodeCamp about the 'e' toggle:
  // e as the parameter of your arrow function. Inside the curly braces, use the preventDefault() method to stop the browser from refreshing the page after submitting the form.
  function handleFormSubmit(e) {
    e.preventDefault(); // Stop default form submission

    const name = document.getElementById("name").value.trim();
    const dob = new Date(birthDateInput.value);
    const email = document.getElementById("email").value.trim();

    //anyhow ,that is just to get the valuse of the radio button
//uuuhhhh,who knows how long it will be til we get back...the ? is to prevent that stupidass console error if nothing is checkd 
 const role = document.querySelector('input[name="role"]:checked')?.value;
const uniSelection=other.value;
const majorValue = document.getElementById("studentselect").value || document.getElementById("professorselect").value;

    if (!isOldEnough(dob)) {
      alert("Sorry, you must be at least 17 years old to continue.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }



    //i have found the datamanager colpritttttttt
    //i have to figure out the rest 

    saveUserData(name, dob, email,uniSelection,role,majorValue);
    window.location.href = "register.html"; // Correct redirect
  }

  // --- 5. SKIP TO LOGIN ---
  // Redirect user to login page if they already have an account
  function handleAlreadyAccount() {
    window.location.href = "login.html";
  }

  // --- 6. EVENT LISTENERS ---
  // Attach functions to form and button
  function attachEventListeners() {
    if (form) {
      form.addEventListener("submit", handleFormSubmit);       // When form is submitted
    }
    if (alreadyBtn) {
      alreadyBtn.addEventListener("click", handleAlreadyAccount); // When button is clicked
    }
  }


 //////////////////////////////////
 //finally got some time to fix the damn choice.js problem
 //lets try and hope for the best
 //yeah about the choice js
 // i found that it was my logic...no wonder it was...
 //the fix is i removed the required from the hidden elements..
 //i should add the validation for them in js...but now ihave grouwn to hate choices.js



  // Start everything
  initializer();

  /////////////////////////////
  ////// supposedly for the damn tag...
  // why do i hate myself? anyway...
  // const altForm = document.getElementById("indexForm");
  // if (altForm) {
  //   altForm.addEventListener("submit", (e) => {
  //     e.preventDefault();
  //     const form = e.target;
  //     const fullName = form.full_name.value;
  //     const email = form.email.value;
  //     const role = form.querySelector('input[name=role]:checked').value;
  //     console.log(fullName);
  //     console.log(email);
  //     console.log(role);
  //   });
 // }




 

}); // End of DOMContentLoaded wrapper

// i had the bright idea to make a checklist inside every script to not forget what i should add or do... better late than never ig...
// validate the age limit to 17 or more ✅
// maybe add the age max at some point (people born in 1000 can register apparently...)
// validate EMAIL format ✅
// the full name should have at least one space (my testing is the reason)
// handle form validation => form validation feedback
// before everything else/i had the bright idea to use choice.js (i need to download that too)...and the damn thing stoped the page progress
//sooooo lets try and fix that
//daaaaaaaaaaaaaaaaaaaamn,i added alot of things and they are not getting submitted..
//update the form submition data

  //how am i at 200 lines of code just for less then half of what i need?
