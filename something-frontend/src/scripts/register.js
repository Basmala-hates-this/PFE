//i still hate javascript



//i had the brigth idea to make a check list inside every script to not forget what i should add or do...better late then never ig...
//password===confirm-password ✅
//that checkmark thing==>maybe give up on that?
//add a password strength indicator✅
//add a username regex or somthing to actually have a username(english + brain are not doing thier work now ...)✅
//=>bisaclly the username should have a number or a spicial character of some sort=>is this necessary though?
//
//handle form validation =>form validation feedback
//save progress with local storage
//maybe add a loading spinner or subtle animation when the form is submitted.
//following the username function,CHANGE THE DAMN COLORS AND FONT STYLES TO SOMTHING MORE APPEALING✅
//steal the colors from the login page later ok?✅



//welp,i effded up 
//ok,i need the btn to be here because i want it disabeled until all conditions are met or somthing like that.....................
const submitBtn = document.querySelector(".btn2");


//if you need more help,look at the login.js file if you found something usefull :),or just ask me directly i guess or chatgpt......idk

//i have a question,wich one comes first? the username validation ,the password matching or password strength indecator?????hmmmmm
//anyways:

// welp,its the user name 
const inputUN = document.getElementById("username");
const feedback = document.getElementById("feedback");
 //lets talk about feedback,bisaclly its a <p> tag under the username input that will give the user feedback about thier username input
  //it uses the ".textContent" property to change the text inside the <p> tag and the ".style.color" to change the color of the text
  //template literals are used to make it easier to add variables inside strings( the `${}` thingy)
   //if this says anything at all, it's screaming at me to finish the abandoned freecodecamp course i started .... 

inputUN.addEventListener("input", () => {
    //swaping 'click' to 'input' for live validation.why didnt i think of this earlier.....

  const username = inputUN.value;
// meaning every time the button is clicked it gets the current value of the input
//i really hate javascript sometimes.....
  if (username.length === 0) {
    feedback.style.display = "none";
    return;
  }

  feedback.style.display = "block";// show feedback only if there's input

  const minLength = 5;
  const maxLength = 20;
  const allowedPattern = /^[a-zA-Z0-9_@\$&\-~]+$/;// regex for letters, numbers, underscores.tepical username setup.but i added the $@& and ~ for some reason that i dont know it

  if (username.length < minLength) {
    feedback.textContent = `Username must be at least ${minLength} characters.`;
    feedback.style.color = "#fc0c0ce9";
  } else if (username.length > maxLength) {
    feedback.textContent = `Username must be no more than ${maxLength} characters.`;
    feedback.style.color = "#fc0c0ce9";
  } else if (!allowedPattern.test(username)) {
    feedback.textContent = "Only letters, numbers, and '@,$,&,-,~' symbols are allowed.";
    feedback.style.color = "#fc0c0ce9";
  } else {
    feedback.textContent = "Username looks good!";
    feedback.style.color = "#046e12ff";
  }
});//lets make this function look pretty when we have the soul for it ,ok?

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//lets try the password strength indicator here ig 
const passwordInput = document.getElementById("password");
const strengthF = document.getElementById("strength");


passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  strengthF.style.display = password.length > 0 ? "block" : "none";
// ok hear me out, ternary operator looks better and smarter than an if else statement  :).
// you can modefy it in the part down below if ou want 
  //  if (password.length === 0) {
  //   strengthF.style.display = "none"; // hide if empty
  //   return;
  // }

  // strengthF.style.display = "block"; // show feedback only if there's input
   let strength=0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[@$&\-~!#%^*+=]/.test(password)) strength++;

  // Feedback messages  #aa360cff  #b44902ff
  switch (strength) {
    case 0:
      console.log("no password input yet");//this for somereason only shows up when you attempt to input somthing then delete it. its most likely because of the ternary operator up there
      break;
    case 1:
      strengthF.textContent = "Very weak, try harder ";
      strengthF.style.color = "#fc0c0ce9";
      break;
    case 2:
      strengthF.textContent = "Still weak,you can do better ";
      strengthF.style.color = "#fe6905ff";
      break;
    case 3:
      strengthF.textContent = "Moderate,almost there.Try abit more? ";
      strengthF.style.color = "	#983a04ff	";
      break;
    case 4:
      strengthF.textContent = "Strong,good job... ";
      strengthF.style.color = "#03a794ff";
      break;
    case 5:
      strengthF.textContent = "Very strong,proud of you! :) ";
      strengthF.style.color = "#249733ff";
      break;
  }
   // Disable submit if strength is 3 or less
  submitBtn.disabled = (strength <= 3);
});




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  trying to work on the confirm password===password or button wont work.something of the sort :)

const confirmPassword = document.getElementById("Cpassword");

submitBtn.disabled = true; 

// /////me be extra,me add checkmark for no reason :). me think this is bad idea now... me migth do it anyways
// const checkmark = document.querySelector('.checkmark');

//the function is kinda self explanatory(why did i stay in this major?)

function checkPasswordsMatch() {
  if (password.value === confirmPassword.value && password.value !== "") {
    submitBtn.disabled = false;
    // checkmark.style.display = 'inline';
  } else {
    submitBtn.disabled = true;
    // checkmark.style.display = 'none';
  }
}

password.addEventListener("input", checkPasswordsMatch);
confirmPassword.addEventListener("input", checkPasswordsMatch);

//NOTE TO GET BACK TO: the checkmark didnt work,maybe fix when you have the sole for it



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//as usuale,leaving th check list and doing something random.
//Yay,button animations.....Fuck me sideways...
function checkPasswordsMatch() {
  if (password.value === confirmPassword.value && password.value !== "") {
    submitBtn.disabled = false;
    submitBtn.classList.add("active"); 
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove("active"); 
  }
}





  //hehehehehehehehehehehe
    //show password toggle 
    //seriously how do they do those eye thinggiiis?i'll look that up when i have the time...till then...checkbox it is..
 
    const toggle = document.getElementById("togglePassword");
    const label=document.getElementById("ohhh");

 


toggle.addEventListener("change", () => {
  passwordInput.type = toggle.checked ? "text" : "password";
  confirmPassword.type= toggle.checked ? "text" : "password";
  if(toggle.checked){
    label.innerText=" 🙈";
  }
  else{
    label.innerText=" 👀";
  }
});


   

//////////////////////////////////////////
//localstorage work ,well kinda.....



const registerForm = document.getElementById("registerForm");

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // retrieve existing users or start with an empty array
    let users = JSON.parse(localStorage.getItem("users")) || [];
//me extra again.instead of simple one user implementation,multiple users check.maye it will make it easy in the framwork later?
    // check if username already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      alert("Username already exists!");//self explanatory
      return;
    }

    // add new user
    users.push({ username, password });

    // save back to localStorage
    localStorage.setItem("users", JSON.stringify(users));//i need to remember to encrypt the passwords later.ok?/also ifyou need json info,you migtht find some in info.js
    
    // After pushing newUser into users array and saving it:
    localStorage.setItem("users", JSON.stringify(users));

  // Also set the current user (auto-login)
     localStorage.setItem("currentUser", username);



    alert("Registration successful!");
    window.location.href = "fin.html";
  });

//testing the local storage part here is how it works:
console.log("Saved users:", JSON.parse(localStorage.getItem("users")));





// | Action                                                 | Description                                  |
// | ------------------------------------------------------ | -------------------------------------------- |
// | `JSON.parse()`                                         | Converts saved text → JavaScript object      |
// | `JSON.stringify()`                                     | Converts JavaScript object → text for saving |
// | `localStorage.getItem("users")`                        | Reads saved user list                        |
// | `localStorage.setItem("users", JSON.stringify(users))` | Updates user list                            |
