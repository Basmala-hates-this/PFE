const toCamel = require('../utils/toCamel');
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

  return toCamel(result.rows[0]);
};

const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return toCamel(result.rows[0]) || null;
};

const findByUsername = async (username) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
 return toCamel(result.rows[0]) || null;
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return toCamel(result.rows[0]) || null;
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

  return toCamel(result.rows[0]) || null;
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
  return toCamel(result.rows);
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