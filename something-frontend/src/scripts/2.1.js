// function openPanel(type) {
//   const panel = document.getElementById("leftPanel");
//   const content = document.getElementById("panelContent");

//   if (panel.classList.contains("active") && content.dataset.type === type) {
//     panel.classList.remove("active");
//     content.dataset.type = "";
//     return;
//   }

//   content.dataset.type = type;

//   if (type === "messages") {
//     content.innerHTML = `
//       <h2>Messages</h2>
//       <p>No new messages yet.</p>
//     `;
//   } else if (type === "followers") {
//     content.innerHTML = `
//       <h2>Followers</h2>
//       <p>You have 42 followers.</p>
//     `;
//   }

//   panel.classList.add("active");
// }
//////////////////////////////////////////////////////////
//icon button toggles and panels
const buttons = document.querySelectorAll('.icon-btn');
        const contents = document.querySelectorAll('.content');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.id.replace('Btn', 'Page');
                const targetElement = document.getElementById(target);
                
                // Toggle active state for content
                if (targetElement.classList.contains('active')) {
                    // If already active, deactivate it (close)
                    targetElement.classList.remove('active');
                    btn.classList.remove('active');
                } else {
                    // Otherwise, close all and open the clicked one
                    //pain,all i can feel is pain....
                    // Remove active from all contents and buttons
                    buttons.forEach(b => b.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));

                    // Activate the clicked button and content
                    btn.classList.add('active');
                    targetElement.classList.add('active');
                }
            });
        });

//////////////////////////////////////////////////////////
//lets try working on ligth/dark mode toggle(hoping for the best here...)
//
//yeah,i realized i did this completly wrong.(says the one hating inline styles but uses them anyways :/ )
//i needa diffrent approach here....lets try again
//i need changes in the way i use css in the first place,welp we are using root for this one



// const lgm = document.getElementById('lgm');
// const sidebar = document.querySelector('.sidebar');
// const main=document.querySelector('.main');
// const body=document.body;
// const sab=document.querySelector('.side-action-bar');
// const fypc=document.querySelector('.fyp-container');
// const header=document.querySelector('.header');
// const fypf=document.querySelector('.fyp-feed');
// const font=document.querySelector('h2');
// const font2=document.querySelector('h1');
// const h2s=document.getElementById('h2');

// lgm.addEventListener('click', () => {
//     body.classList.toggle('light-mode')? lgm.innerText="Light Mode?":lgm.innerText="Dark Mode?";
//     lgm.innerText="Dark Mode?";
//     lgm.style.backgroundColor = "#9CBBFC";
//     // lgm.style.backgroundColor:hover = "#48bccc";
//     sidebar.style.backgroundColor = "#9CBBFC";
//     main.style.backgroundColor = "#9CBBFC";
//     body.style.backgroundColor = "#4840A3";
//     fypc.style.backgroundColor = "#6c93e9ff";
//     sab.style.backgroundColor = "#6c93e9ff";
//     header.style.backgroundColor = "#6c93e9ff";
//     fypf.style.backgroundColor = "#4840A3";
//     font.style.color="#000000";
//     font2.style.color="#000000";
//     h2s.style.color="#000000";
// });
        ///i'll leave this monstrosity here so we can laugh at my stupidity later///
//////////////////////////
//carry on,the actual code that wont burn your eyes:
const lgm = document.getElementById("lgm");
const body = document.body;
///////////////why not feel extar and save the prefrence to the mode in local storage?//////////

/////if there is no saved preference,detect system theme and set it as default/////i still hate myself tho 
let savedTheme = localStorage.getItem("theme");

if (!savedTheme) {
  // if there is no saved preference then we are briching privacy and detecting system theme
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;//it all falls on this ,it detectes the system theme and i think applies it?
  savedTheme = prefersLight ? "light" : "dark";
  localStorage.setItem("theme", savedTheme);
}
// check saved mode on load 
if (localStorage.getItem("theme") === "light") {
     body.classList.add("light-mode"); 
     lgm.textContent = "Dark Mode 🌙"; 
    } 
lgm.addEventListener("click", () => {
  body.classList.toggle("light-mode");
  
  if (body.classList.contains("light-mode")) {
    lgm.textContent = "Dark Mode 🌙";
  } else {
    lgm.textContent = "Light Mode ☀️";
  }
  // toggle theme
  const mode = body.classList.contains("light-mode") ? "light" : "dark";
     localStorage.setItem("theme", mode);
     lgm.textContent = mode === "light" ? "Dark Mode 🌙" : "Light Mode ☀️"; 
});
//////////////////////////i see now that this is way better and i hate my self ///
//dellete this to reset theme preference///
// localStorage.removeItem("theme");



//////////////////////////////////////////////////////////
//Ayyy,good idea ,lets show username on dashboard
// get the currently logged-in user
document.addEventListener("DOMContentLoaded", () => {
 const currentUser =
   localStorage.getItem("currentUser") || localStorage.getItem("loggedInUser");

if (!currentUser) {
    //if there is no logged in user,redirect to login page
  window.location.href = "login.html";
} else {
    //else display the nightmare 
  document.getElementById("usernameDisplay").textContent = currentUser;
}


  // logout button clears session and redirects
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  });
  });
   

