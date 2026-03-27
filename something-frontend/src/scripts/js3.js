// ======== LocalStorage Mock Data ========this needs to go and be replaced with real ones
const currentUserId = 1; // For testing, user with id=1
localStorage.setItem("currentUser", currentUserId);

const users = [
  { id: 1, fullname: "Basmala", role: "student", uni: "UniA", majors: ["CS"], subjects: ["DS"] },
  { id: 2, fullname: "Sarah", role: "professor", uni: "UniA", majors: ["CS","Math"], subjects: ["DS","Calc"] },
  { id: 3, fullname: "Guest", role: "guest", uni: "UniA", majors: ["CS"], subjects: [] }
];

const rooms = [
  { id: 1, name: "UniA Room", type: "uni", uni: "UniA", members: [1,2] },
  { id: 2, name: "CS Major Room", type: "major", uni: "UniA", major: "CS", members: [1,2] },
  { id: 3, name: "DS Subject Room", type: "subject", major: "CS", subject: "DS", members: [1,2] },
  { id: 4, name: "Public Space", type: "public", members: [1,2,3] },
  { id: 5, name: "noah Private Room", type: "private", creator: 1, accessCode: "XYZ123", members: [1] }
];

const posts = [
  { id: 1, roomId: 1, userId: 2, content: "Welcome to UniA Room!" },
  { id: 2, roomId: 3, userId: 1, content: "Question about DS model..." },
  { id: 3, roomId: 5, userId: 1, content: "Private Room Post" },
  { id: 4, roomId: 4, userId: 2, content: "Public space is fun!" }
];

localStorage.setItem("users", JSON.stringify(users));
localStorage.setItem("rooms", JSON.stringify(rooms));
localStorage.setItem("posts", JSON.stringify(posts));

// ===============================
//  Local Storage Setup
// ===============================
const currentUser = localStorage.getItem("currentUser") || "Guest";
document.getElementById("usernameDisplay").textContent = currentUser;

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
});


//  Dark/Light Mode

const lgm = document.getElementById("lgm");
const body = document.body;
let savedTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
if(savedTheme === "light") body.classList.add("light-mode");
lgm.textContent = body.classList.contains("light-mode") ? "Dark Mode 🌙" : "Light Mode ☀️";

lgm.addEventListener("click", () => {
    body.classList.toggle("light-mode");
    const mode = body.classList.contains("light-mode") ? "light" : "dark";
    localStorage.setItem("theme", mode);
    lgm.textContent = mode === "light" ? "Dark Mode 🌙" : "Light Mode ☀️";
});


//  Rooms & Feed Setup

const store = {
    rooms: {
        "uni-001": {name:"Uni Room", posts: [{user:"basmala", content:"Welcome to Uni!"} ]},
        "major-001": {name:"CS Major", posts: [{user:"Sarah", content:"CS Major intro"}]},
        "subject-001": {name:"Algorithms", posts: [{user:"kawther", content:"Sorting algo discussion"}]},
        "private-001": {name:"Study Group", posts: [{user:"noah", content:"Private chat only"}]}
    }
};

let selectedRooms = ["uni-001","major-001"]; // default rooms

// Render room checkboxes
const roomCheckboxes = document.getElementById("room-checkboxes");
Object.entries(store.rooms).forEach(([id, room]) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = id;
    cb.checked = selectedRooms.includes(id);
    cb.addEventListener("change", () => {
        selectedRooms = Array.from(roomCheckboxes.querySelectorAll("input:checked")).map(i => i.value);
        renderFeed();
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(` ${room.name}`));
    roomCheckboxes.appendChild(label);
    roomCheckboxes.appendChild(document.createElement("br"));
});

// Render feed posts
function renderFeed() {
    const feed = document.getElementById("fyp-feed");
    feed.innerHTML = "";
    let allPosts = [];
    selectedRooms.forEach(id => {
        if(store.rooms[id]) allPosts = allPosts.concat(store.rooms[id].posts.map(p=>({...p, room:id})));
    });
    allPosts.sort((a,b)=>b.createdAt-(a.createdAt||Date.now())); // newest first
    if(allPosts.length === 0) feed.innerHTML = "<p>No posts yet.</p>";
    allPosts.forEach(p => {
        const div = document.createElement("div");
        div.textContent = `[${store.rooms[p.room].name}] ${p.user}: ${p.content}`;
        feed.appendChild(div);
    });
}
renderFeed();


//  Side Action Bar

const buttons = document.querySelectorAll('.icon-btn');
const contents = document.querySelectorAll('.content');

buttons.forEach(btn=>{
    btn.addEventListener("click",()=>{
        const target=document.getElementById(btn.id.replace("Btn","Page"));
        if(target.classList.contains("active")){
            target.classList.remove("active"); btn.classList.remove("active");
        }else{
            buttons.forEach(b=>b.classList.remove("active"));
            contents.forEach(c=>c.classList.remove("active"));
            target.classList.add("active"); btn.classList.add("active");
        }
    });
});


//  Posts Form (Local Storage)

document.getElementById("postsPage").addEventListener("submit", e=>{
    e.preventDefault();
    const title = document.getElementById("post-title").value.trim();
    const desc = document.getElementById("post-discription").value.trim();
    if(!title||!desc) return alert("Fill both fields");
    // Add to first selected room
    const roomId = selectedRooms[0];
    if(store.rooms[roomId]) store.rooms[roomId].posts.push({user:currentUser, content:`${title} - ${desc}`, createdAt:Date.now()});
    renderFeed();
    e.target.reset();
});
