const postRepo = require('../repositories/post.repo');
const commentRepo = require('../repositories/comment.repo');
const userRepo = require('../repositories/user.repo');
const roomRepo = require('../repositories/room.repo');
const pool = require('../db');
const { sendFollowEmail } = require('../config/email');


const fetchUserMajors = async (userId) => {
  const result = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1`,
    [userId]
  );
  return result.rows.map(r => r.name);
};

const getMe = async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password_hash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};

const updateMe = async (req, res) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  const currentUser = await userRepo.findById(userId);
  if (!currentUser) return res.status(404).json({ message: 'User not found' });

  if (username && username !== currentUser.username) {
    const existing = await userRepo.findByUsername(username);
    if (existing) return res.status(400).json({ message: 'Username already taken' });
  }

  if (email && email !== currentUser.email) {
    const existing = await userRepo.findByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email already exists' });
  }

  const profilePicUrl = req.file
    ? `http://localhost:5000/uploads/${req.file.filename}`
    : currentUser.profile_pic_url;

  const updatedUser = await userRepo.updateUser(userId, {
    username: username || currentUser.username,
    email: email || currentUser.email,
    profilePicUrl,
  });

  const { password_hash, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
};

const deleteMe = async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.deleteUser(req.user.id);
  res.json({ message: 'Account deleted successfully' });
};

const getUserById = async (req, res) => {
  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password_hash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};

const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const result = await pool.query(
    `SELECT id, username, email, role, authority_level, rating, profile_pic_url
     FROM users
     WHERE username ILIKE $1 AND id != $2
     LIMIT 20`,
    [`%${q}%`, req.user.id]
  );
  res.json(result.rows);
};

// --- stats ---

const getMyStats = async (req, res) => {
  const userId = req.user.id;
  await getStatsForUser(userId, res);
};

const getStatsByUserId = async (req, res) => {
  await getStatsForUser(req.params.userId, res);
};

const getStatsForUser = async (userId, res) => {
  const [posts, comments, votes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM posts WHERE user_id = $1`, [userId]),
    pool.query(`SELECT COUNT(*) FROM comments WHERE user_id = $1`, [userId]),
    pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE v.type = 'useful'      AND (p.user_id = $1 OR c.user_id = $1)) as useful,
        COUNT(*) FILTER (WHERE v.type = 'useless'     AND p.user_id = $1)                     as useless,
        COUNT(*) FILTER (WHERE v.type = 'specialized' AND c.user_id = $1)                     as specialized
       FROM votes v
       LEFT JOIN posts    p ON p.id = v.post_id
       LEFT JOIN comments c ON c.id = v.comment_id`,
      [userId]
    ),
  ]);

  res.json({
    postsCount:        parseInt(posts.rows[0].count),
    commentsCount:     parseInt(comments.rows[0].count),
    usefulReceived:    parseInt(votes.rows[0].useful),
    uselessReceived:   parseInt(votes.rows[0].useless),
    specializedReceived: parseInt(votes.rows[0].specialized),
  });
};

const getMyReceivedVotes = async (req, res) => {
  const userId = req.user.id;
  const { type } = req.query;

  if (type === 'useful') {
    const [posts, comments] = await Promise.all([
      pool.query(
        `SELECT p.* FROM posts p
         JOIN votes v ON v.post_id = p.id
         WHERE p.user_id = $1 AND v.type = 'useful'`,
        [userId]
      ),
      pool.query(
        `SELECT c.* FROM comments c
         JOIN votes v ON v.comment_id = c.id
         WHERE c.user_id = $1 AND v.type = 'useful'`,
        [userId]
      ),
    ]);
    return res.json([
      ...posts.rows.map(p => ({ ...p, sourceType: 'post' })),
      ...comments.rows.map(c => ({ ...c, sourceType: 'comment' })),
    ]);
  }

  if (type === 'useless') {
    const result = await pool.query(
      `SELECT p.* FROM posts p
       JOIN votes v ON v.post_id = p.id
       WHERE p.user_id = $1 AND v.type = 'useless'`,
      [userId]
    );
    return res.json(result.rows.map(p => ({ ...p, sourceType: 'post' })));
  }

  if (type === 'specialized') {
    const result = await pool.query(
      `SELECT c.* FROM comments c
       JOIN votes v ON v.comment_id = c.id
       WHERE c.user_id = $1 AND v.type = 'specialized'`,
      [userId]
    );
    return res.json(result.rows.map(c => ({ ...c, sourceType: 'comment' })));
  }

  res.json([]);
};

const getPostsByUser = async (req, res) => {
  const posts = await postRepo.getPostsByUser(req.params.userId);
  res.json(posts);
};

const getCommentsByUser = async (req, res) => {
  const comments = await commentRepo.getCommentsByUser(req.params.userId);
  res.json(comments);
};

const getMyComments = async (req, res) => {
  const comments = await commentRepo.getCommentsByUser(req.user.id);
  res.json(comments);
};

// --- follows ---

const followUser = async (req, res) => {
  const followerId = req.user.id;
  const { userId: targetId } = req.params;

  const result = await userRepo.followUser(followerId, targetId);
  if (result.error) return res.status(400).json({ message: result.error });

  try {
    const target = await userRepo.findById(targetId);
    const follower = await userRepo.findById(followerId);
    await sendFollowEmail(target.email, follower.username);
  } catch (err) {
    console.error('Failed to send follow email:', err);
  }

  res.json({ message: 'Followed successfully' });
};

const unfollowUser = async (req, res) => {
  const followerId = req.user.id;
  const { userId: targetId } = req.params;

  const result = await userRepo.unfollowUser(followerId, targetId);
  if (result.error) return res.status(400).json({ message: result.error });

  res.json({ message: 'Unfollowed successfully' });
};

const getFollowers = async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.profile_pic_url, u.rating
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = $1`,
    [userId]
  );
  res.json(result.rows);
};

const getFollowing = async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.profile_pic_url, u.rating
     FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = $1`,
    [userId]
  );
  res.json(result.rows);
};

// --- reports ---

const reportUser = async (req, res) => {
  const { userId } = req.params;
  const { reason, details } = req.body;
  const reportedBy = req.user.id;

  if (!reason) return res.status(400).json({ message: 'Report reason is required' });
  if (reportedBy === userId) return res.status(400).json({ message: 'Cannot report yourself' });

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  try {
    await pool.query(
      `INSERT INTO reports (reported_by, reported_user_id, reason, details)
       VALUES ($1,$2,$3,$4)`,
      [reportedBy, userId, reason, details || null]
    );
    res.json({ message: 'User reported successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Already reported this user' });
    throw err;
  }
};

// --- professor reorientation ---

const selectMajorAfterRejection = async (req, res) => {
  const userId = req.user.id;
 
  const { selectedMajor } = req.body;
  console.log("selectedMajor received:", selectedMajor);
   console.log("userId:", userId);

  const user = await userRepo.findById(userId);
  console.log("user.pending_reorientation:", user.pending_reorientation);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.pendingReorientation) return res.status(400).json({ message: 'No reorientation pending' });




const majorLookup = await pool.query(
  `SELECT id FROM majors WHERE name = $1`,
  [selectedMajor]
);
if (majorLookup.rows.length === 0) {
  return res.status(400).json({ message: 'Major not found' });
}
const selectedMajorId = majorLookup.rows[0].id;

  // verify user is enrolled in this major
  const majorCheck = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1 AND um.major_id = $2`,
    [userId, selectedMajorId]
  );
  if (majorCheck.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid major selection' });
  }

  // remove all other majors from user_majors
  await pool.query(
    `DELETE FROM user_majors WHERE user_id = $1 AND major_id != $2`,
    [userId, selectedMajorId]
  );

  // remove user from major/subject rooms that don't match selected major
  await pool.query(
    `DELETE FROM room_members
     WHERE user_id = $1
     AND room_id IN (
       SELECT r.id FROM rooms r
       WHERE r.type IN ('major','subject')
       AND r.major_id != $2
     )`,
    [userId, selectedMajorId]
  );

  await userRepo.updateUser(userId, { pendingReorientation: false });

  res.json({ message: 'Major selected successfully' });
};

// --- valid input correction ---

const selectValidInputs = async (req, res) => {
  const userId = req.user.id;
  const { selectedUniversityCode, selectedMajorNames } = req.body;

  const user = await userRepo.findById(userId);
 // console.log("user found:", user);           // add this
 // console.log("status:", user?.other_input_status); 
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.otherInputStatus !== 'rejected') {
    return res.status(400).json({ message: 'No input correction needed' });
  }

  // handle university correction
  if (selectedUniversityCode) {
    const uniCheck = await pool.query(
      `SELECT * FROM universities WHERE code = $1`,
      [selectedUniversityCode]
    );
    if (uniCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid university selection' });
    }
    const newUni = uniCheck.rows[0];

    // leave old university room, join new one
    await pool.query(
      `DELETE FROM room_members
       WHERE user_id = $1
       AND room_id IN (
         SELECT id FROM rooms WHERE type = 'university' AND university_code = $2
       )`,
      [userId, user.universityCode]
    );

    const newUniRoom = await pool.query(
      `SELECT id FROM rooms WHERE type = 'university' AND university_code = $1`,
      [selectedUniversityCode]
    );
    if (newUniRoom.rows.length > 0) {
      await roomRepo.addMember(newUniRoom.rows[0].id, userId);
    }

    await userRepo.updateUser(userId, {
      universityCode: selectedUniversityCode,
      universityName: newUni.name,
    });
  }

  // handle major correction
 if (selectedMajorNames?.length) {
  const majorResults = await pool.query(
`SELECT id, name FROM majors WHERE name = ANY($1::text[]) AND status = 'approved'`,
    [selectedMajorNames]
  );
  const foundNames = majorResults.rows.map(r => r.name);
for (const name of selectedMajorNames) {
  if (!foundNames.includes(name)) {
    const inserted = await pool.query(
      `INSERT INTO majors (name, status) VALUES ($1, 'approved') RETURNING id, name`,
      [name]
    );
    majorResults.rows.push(inserted.rows[0]);
  }
}
  const selectedMajorIds = majorResults.rows.map(r => r.id);

  // remove user from all pending major rooms
  await pool.query(
    `DELETE FROM room_members WHERE user_id = $1
     AND room_id IN (
       SELECT r.id FROM rooms r
       JOIN majors m ON m.id = r.major_id
       WHERE r.type = 'major' AND m.status = 'rejected'
     )`,
    [userId]
  );

  // remove pending majors from user_majors
  await pool.query(
    `DELETE FROM user_majors WHERE user_id = $1
     AND major_id IN (
       SELECT id FROM majors WHERE status = 'rejected'
     )`,
    [userId]
  );

  // add new valid majors
  for (const majorId of selectedMajorIds) {
    await pool.query(
      `INSERT INTO user_majors (user_id, major_id) VALUES ($1,$2)
       ON CONFLICT (user_id, major_id) DO NOTHING`,
      [userId, majorId]
    );
    const majorRoom = await pool.query(
      `SELECT id FROM rooms WHERE type = 'major' AND major_id = $1`,
      [majorId]
    );
    if (majorRoom.rows.length > 0) {
      await roomRepo.addMember(majorRoom.rows[0].id, userId);
    }
  }
}
 
  await userRepo.updateUser(userId, { otherInputStatus: 'corrected' });
  const updatedUser = await userRepo.findById(userId);
const userMajors = await fetchUserMajors(userId);

res.json({ 
  message: 'Inputs updated successfully',
  user: { ...updatedUser, majors: userMajors }
});
};

const getMyMajors = async (req, res) => {
  const result = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1`,
    [req.user.id]
  );
  res.json(result.rows.map(r => r.name));
};

const getUserMajors = async (req, res) => {
  const result = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1`,
    [req.params.userId]
  );
  res.json(result.rows.map(r => r.name));
};

const getMyApplication = async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM admin_applications WHERE user_id = $1`,
    [req.user.id]
  );
  res.json(result.rows[0] || null);
};

const getMyPermissions = async (req, res) => {
  const result = await pool.query(
    `SELECT permission FROM user_permissions WHERE user_id = $1`,
    [req.user.id]
  );
  res.json(result.rows.map(r => r.permission));
};

module.exports = {
  getMe,
  updateMe,
  deleteMe,
  getUserById,
  searchUsers,
  getMyStats,
  getStatsByUserId,
  getMyReceivedVotes,
  getPostsByUser,
  getCommentsByUser,
  getMyComments,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  reportUser,
  selectMajorAfterRejection,
  selectValidInputs,
  getMyMajors,
  getUserMajors,
  getMyApplication,
  getMyPermissions,
};