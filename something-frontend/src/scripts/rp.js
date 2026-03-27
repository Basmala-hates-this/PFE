const password = document.querySelector('.password');
const confirmPassword = document.querySelector('.Cpassword');
const submitBtn = document.querySelector('.btn6');

 submitBtn.disabled = false;

//the function is kinda self explanatory(why did i stay in this major?)
function checkPasswordsMatch() {
  if (password.value === confirmPassword.value && password.value !== "") {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;

  }
}

password.addEventListener('input', checkPasswordsMatch);
confirmPassword.addEventListener('input', checkPasswordsMatch);


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