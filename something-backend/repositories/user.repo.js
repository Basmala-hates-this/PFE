// const fs = require("fs");//to connect to the json file(aka false database)
// const path = require("path");
// const filePath = path.join(__dirname, "../data/users.json");//__dirname means "the folder this file is currently in"

// // Read users from the JSON file
// const readUsers = () => {
//   const data = fs.readFileSync(filePath, "utf8");
//   return JSON.parse(data);
// };

// // Write users to the JSON file
// const writeUsers = (usersList) => {
//   fs.writeFileSync(filePath, JSON.stringify(usersList));
// };

// const createUser = (userData) => {
//    const users = readUsers();
//   const newUser = {
//   id: Date.now().toString(),
//   ...userData,
//   rating: 1,
//   verificationStatus: userData.role === 'professor' ? 'pending' : 'none',
//   authorityLevel: 'user',
//   permissions: [],
//   suspendedUntil: null,
//   suspensionReason: null,
//   pendingReorientation: false,
//   violationCount: 0,
//   actionHistory: [],
//   userReports: [],
// };

//    users.push(newUser);
//   writeUsers(users);
//   return newUser;
// };

// const findByEmail = (email) => {
//   const users = readUsers();
//   return users.find((u) => u.email === email);
// };


// const findByUsername = (username) => {
//   const users = readUsers();
//   return users.find((u) => u.username === username);
// };

// const findById = (id) => {
//   const users = readUsers();
//   return users.find((u) => u.id === id);
// };

// const updateUser = (id, updatedData) => {
//   const users = readUsers();
//   const userIndex = users.findIndex((u) => u.id === id);
//   if (userIndex === -1) return null;
//   const updatedUser = { ...users[userIndex], ...updatedData };
//   users[userIndex] = updatedUser;
//   writeUsers(users);
//   return updatedUser;
// };


// const updateRating = (userId, voteType, action) => {
//   const user = findById(userId);
//   if (!user) return;

//   const currentRating = user.rating ?? 1;
  
//   let change = 0;
//   if (voteType === "useful") change = 0.02;
//   else if (voteType === "useless") change = -0.02;
//   else if (voteType === "specialized") change = 0.10;

//   // if removing a vote, reverse the change
//   if (action === "remove") change = -change;

//   const newRating = Math.min(5, Math.max(0, currentRating + change));
//   updateUser(userId, { rating: parseFloat(newRating.toFixed(2)) });
// };


// const deleteUser = (id) => {
//   const users = readUsers();
//   const updatedUsers = users.filter((u) => u.id !== id);
//   writeUsers(updatedUsers);
// };



// //follow/following shit.....................................i hate my life
// const followUser = (followerId, targetId) => {
//   const users = readUsers();
  
//   const follower = users.find(u => u.id === followerId);
//   const target = users.find(u => u.id === targetId);
  
//   if (!follower || !target) return { error: "User not found" };
//   if (followerId === targetId) return { error: "Cannot follow yourself" };
  
//   if (!follower.following) follower.following = [];
//   if (!target.followers) target.followers = [];


// //   console.log("follower.following:", follower.following);
// // console.log("targetId:", targetId);
// // console.log("includes?", follower.following.includes(targetId));
  
//   if (follower.following.includes(targetId)) return { error: "Already following" };
  
//   follower.following.push(targetId);
//   target.followers.push(followerId);
  
//   writeUsers(users);
//   return { success: true };
// };

// const unfollowUser = (followerId, targetId) => {
//   const users = readUsers();
  
//   const follower = users.find(u => u.id === followerId);
//   const target = users.find(u => u.id === targetId);
  
//   if (!follower || !target) return { error: "User not found" };
  
//   follower.following = follower.following?.filter(id => id !== targetId) || [];
//   target.followers = target.followers?.filter(id => id !== followerId) || [];
  
//   writeUsers(users);
//   return { success: true };
// };



// const savePost = (userId, postId) => {
//   const users = readUsers();
//   const user = users.find(u => u.id === userId);
//   if (!user) return { error: "User not found" };
//   if (!user.savedPosts) user.savedPosts = [];
//   if (user.savedPosts.includes(postId)) return { error: "Already saved" };
//   user.savedPosts.push(postId);
//   writeUsers(users);
//   return { success: true };
// };

// const unsavePost = (userId, postId) => {
//   const users = readUsers();
//   const user = users.find(u => u.id === userId);
//   if (!user) return { error: "User not found" };
//   user.savedPosts = (user.savedPosts || []).filter(id => id !== postId);
//   writeUsers(users);
//   return { success: true };
// };



// module.exports = {
//   createUser,
//   findByEmail,
//   findByUsername,
//   findById,
//   updateUser,
//   updateRating,
//   deleteUser,
//   readUsers,
//   followUser,
//   unfollowUser,
//   savePost,
//   unsavePost,
// };


const pool = require('../db');

const createUser = async (userData) => {
  const {
    fullName,
    birthDate,
    email,
    username,
    passwordHash,
    role,
    universityCode,
    universityName,
    profilePicUrl = null,
  } = userData;

  const verificationStatus = role === 'professor' ? 'pending' : 'none';

  const result = await pool.query(
    `INSERT INTO users 
      (full_name, birth_date, email, username, password_hash, role, university_code, university_name, verification_status, profile_pic_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [fullName, birthDate, email, username, passwordHash, role, universityCode, universityName, verificationStatus, profilePicUrl]
  );

  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

const findByUsername = async (username) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const updateUser = async (id, updatedData) => {
  const fields = Object.keys(updatedData);
  if (fields.length === 0) return null;

  // map camelCase keys to snake_case columns
  const columnMap = {
    fullName: 'full_name',
    birthDate: 'birth_date',
    passwordHash: 'password_hash',
    universityCode: 'university_code',
    universityName: 'university_name',
    verificationStatus: 'verification_status',
    proofFileUrl: 'proof_file_url',
    pendingReorientation: 'pending_reorientation',
    otherInputStatus: 'other_input_status',
    violationCount: 'violation_count',
    profilePicUrl: 'profile_pic_url',
    suspendedUntil: 'suspended_until',
    suspensionReason: 'suspension_reason',
    authorityLevel: 'authority_level',
    rating: 'rating',
    role: 'role',
    email: 'email',
    username: 'username',
  };

  const setClauses = fields.map((key, i) => `${columnMap[key] || key} = $${i + 1}`);
  const values = fields.map(key => updatedData[key]);

  const result = await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );

  return result.rows[0] || null;
};

const updateRating = async (userId, voteType, action) => {
  const user = await findById(userId);
  if (!user) return;

  const currentRating = parseFloat(user.rating) ?? 1;

  let change = 0;
  if (voteType === 'useful') change = 0.02;
  else if (voteType === 'useless') change = -0.02;
  else if (voteType === 'specialized') change = 0.10;

  if (action === 'remove') change = -change;

  const newRating = Math.min(5, Math.max(0, currentRating + change));
  await updateUser(userId, { rating: parseFloat(newRating.toFixed(2)) });
};

const deleteUser = async (id) => {
  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
};

const getAllUsers = async () => {
  const result = await pool.query(`SELECT * FROM users`);
  return result.rows;
};

// --- follows ---
const followUser = async (followerId, targetId) => {
  if (followerId === targetId) return { error: 'Cannot follow yourself' };

  try {
    await pool.query(
      `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)`,
      [followerId, targetId]
    );
    return { success: true };
  } catch (err) {
    if (err.code === '23505') return { error: 'Already following' };
    throw err;
  }
};

const unfollowUser = async (followerId, targetId) => {
  await pool.query(
    `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
    [followerId, targetId]
  );
  return { success: true };
};

// --- saved posts ---
const savePost = async (userId, postId) => {
  try {
    await pool.query(
      `INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)`,
      [userId, postId]
    );
    return { success: true };
  } catch (err) {
    if (err.code === '23505') return { error: 'Already saved' };
    throw err;
  }
};

const unsavePost = async (userId, postId) => {
  await pool.query(
    `DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2`,
    [userId, postId]
  );
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
  getAllUsers,
  followUser,
  unfollowUser,
  savePost,
  unsavePost,
};