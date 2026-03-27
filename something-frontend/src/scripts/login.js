//i had the brigth idea to make a check list inside every script to not forget what i should add or do...better late then never ig...
//add input validation to back the required of html
//failed login feedback (when backend IS connected){i'm scared of the backend phase tbh :)}
//validate the username again (could be the same function as the register page )✅ 
//vAliDatE the PassWoRd AgAin...
//be evil and add a login attempt limiter :)=>sadly this is not possible without backend but still...
//be a nice person and add a "Remember Me Checkbox"to store username in localStorage/coockie for convenience
//instead of only relaying on the username to login,i should add an email input aswell to avoid username forgetfulness
//show password toggle 
//handle form validation feedback
//steal the colors from the register page later ok?
/////////////////////////////////////////////
//this for checking if localstorage is working properly
console.log("Login script loaded ✅");








//The irony of my mind,the checklist says the validation would be in the register page first but here i am starting with the login page  first :)
//welp i'll copy past this to the register page anyways..... :)

//OK,lets try the username validation and hope for the best(for now)
// Damn,i wish i could've been able to add audio to explain this. but it is what it is...
  const feedback = document.getElementById("feedback");
  const submitBtn = document.querySelector(".btn2");
//for the best megers,i changes the event from button click to input ,so weget live validation not until a failed login attempt
  const inputUN = document.getElementById("username");
  //lets talk about feedback,bisaclly its a <p> tag under the username input that will give the user feedback about thier username input
  //it uses the ".textContent" property to change the text inside the <p> tag and the ".style.color" to change the color of the text
  //template literals are used to make it easier to add variables inside strings( the `${}` thingy)
   //if this says anything at all, it's screaming at me to finish the abandoned freecodecamp course i started .... 
inputUN.addEventListener('input', ()=>{
 const username = inputUN.value;// meaning every time the button is clicked it gets the current value of the input
//i really hate javascript sometimes.....
  //hides the ugly feedback strip if the input is empty
    if (username.length === 0) {
    feedback.style.display = "none"; // hide if empty
    return;
  }

  feedback.style.display = "block"; // show feedback only if there's input
  // Validation rules
  const minLength = 5;
  const maxLength = 20;
  const allowedPattern = /^[a-zA-Z0-9_@\$&\-~]+$/; // regex for letters, numbers, underscores.tepical username setup
  
  if (username.length < minLength) {
    feedback.textContent = ` Username must be at least ${minLength} characters.`;
    feedback.style.color = "#fc0c0ce9";
  } else if (username.length > maxLength) {
    feedback.textContent = ` Username must be no more than ${maxLength} characters.`;
    feedback.style.color = "#fc0c0ce9";
  } else if (!allowedPattern.test(username)) {
    feedback.textContent = " Only letters, numbers,@,~,$,&,- and underscores are allowed.";
    feedback.style.color = "#fc0c0ce9";
  } else {
    feedback.textContent = " Username looks good!";
    feedback.style.color = "#046e12ff";
  }

});//lets make this function look pretty when we have the soul for it ,ok?


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//back to normal flow,localstorage check for login from data taken from registration.//english not englishing

document.addEventListener("DOMContentLoaded", () => {

const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", (e) => {
    //testing the local storage part here is how it works:
    console.log("form submitted ✅");


    e.preventDefault();

    const loginUsername = inputUN.value.trim();
    const loginPassword = document.getElementById("password").value;


    const users = JSON.parse(localStorage.getItem("users")) || [];

    // Find a user with matching credentials
    const user = users.find(
      user => user.username === loginUsername && user.password === loginPassword
    );

    console.log("Stored users:", users);
    console.log("Typed username:", loginUsername);
     console.log("Typed password:", loginPassword);


    if (user) {
      alert(`Welcome, ${user.username}!`);
      localStorage.setItem("loggedInUser", user.username); // optional: store current user
      window.location.href = "dashboard2.1.html";
    } else {
      alert("Invalid username or password.");
    }
    


  });


  //hehehehehehehehehehehe
    //show password toggle 
    //seriously how do they do those eye thinggiiis?i'll look that up when i have the time...till then...checkbox it is..
    const passwordInput = document.getElementById("password");
    const toggle = document.getElementById("togglePassword");
    const label=document.getElementById("ohhh");

 


toggle.addEventListener("change", () => {
  passwordInput.type = toggle.checked ? "text" : "password";
  if(toggle.checked){
    label.innerText=" 🙈";
  }
  else{
    label.innerText=" 👀";
  }
});

});
   
 

