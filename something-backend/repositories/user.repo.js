const fs = require("fs");//to connect to the json file(aka false database)
const path = require("path");
const filePath = path.join(__dirname, "../data/users.json");//__dirname means "the folder this file is currently in"

// Read users from the JSON file
const readUsers = () => {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

// Write users to the JSON file
const writeUsers = (usersList) => {
  fs.writeFileSync(filePath, JSON.stringify(usersList));
};

const createUser = (userData) => {
   const users = readUsers();
  const newUser = {
    id: Date.now().toString(),
    ...userData,
     rating: 1,//starting oint because why the hell would u start with 0 reddit?that is annoying as hell
    verificationStatus: userData.role === 'professor' ? 'pending' : 'none',
    authorityLevel: 'user',
    permissions: []   
  };

   users.push(newUser);
  writeUsers(users);
  return newUser;
};

const findByEmail = (email) => {
  const users = readUsers();
  return users.find((u) => u.email === email);
};


const findByUsername = (username) => {
  const users = readUsers();
  return users.find((u) => u.username === username);
};

const findById = (id) => {
  const users = readUsers();
  return users.find((u) => u.id === id);
};

const updateUser = (id, updatedData) => {
  const users = readUsers();
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) return null;
  const updatedUser = { ...users[userIndex], ...updatedData };
  users[userIndex] = updatedUser;
  writeUsers(users);
  return updatedUser;
};


const updateRating = (userId, voteType, action) => {
  const user = findById(userId);
  if (!user) return;

  const currentRating = user.rating ?? 1;
  
  let change = 0;
  if (voteType === "useful") change = 0.02;
  else if (voteType === "useless") change = -0.02;
  else if (voteType === "specialized") change = 0.10;

  // if removing a vote, reverse the change
  if (action === "remove") change = -change;

  const newRating = Math.min(5, Math.max(0, currentRating + change));
  updateUser(userId, { rating: parseFloat(newRating.toFixed(2)) });
};


const deleteUser = (id) => {
  const users = readUsers();
  const updatedUsers = users.filter((u) => u.id !== id);
  writeUsers(updatedUsers);
};



//follow/following shit.....................................i hate my life
const followUser = (followerId, targetId) => {
  const users = readUsers();
  
  const follower = users.find(u => u.id === followerId);
  const target = users.find(u => u.id === targetId);
  
  if (!follower || !target) return { error: "User not found" };
  if (followerId === targetId) return { error: "Cannot follow yourself" };
  
  if (!follower.following) follower.following = [];
  if (!target.followers) target.followers = [];


  console.log("follower.following:", follower.following);
console.log("targetId:", targetId);
console.log("includes?", follower.following.includes(targetId));
  
  if (follower.following.includes(targetId)) return { error: "Already following" };
  
  follower.following.push(targetId);
  target.followers.push(followerId);
  
  writeUsers(users);
  return { success: true };
};

const unfollowUser = (followerId, targetId) => {
  const users = readUsers();
  
  const follower = users.find(u => u.id === followerId);
  const target = users.find(u => u.id === targetId);
  
  if (!follower || !target) return { error: "User not found" };
  
  follower.following = follower.following?.filter(id => id !== targetId) || [];
  target.followers = target.followers?.filter(id => id !== followerId) || [];
  
  writeUsers(users);
  return { success: true };
};





module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
  updateUser,
  updateRating,
  deleteUser,
  readUsers,
  followUser,
  unfollowUser,
};
