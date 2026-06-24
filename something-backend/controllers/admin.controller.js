// //this one is getting humangasoures....this is bad but not so bad...it has all admin shit which is bad...

const userRepo = require('../repositories/user.repo');
const postRepo = require('../repositories/post.repo');
const commentRepo = require('../repositories/comment.repo');
const roomRepo = require('../repositories/room.repo');
const pool = require('../db');
const PERMISSIONS = require('../config/permissions');
const hasPermission = require('../utils/hasPermission');
const toCamel = require('../utils/toCamel');

const {
  sendProfessorRejectionEmail,
  sendProfessorVerificationEmail,
  sendAdminApplicationAcceptedEmail,
  sendAdminApplicationRejectedEmail,
  sendRoomRequestApprovedEmail,
  sendRoomRequestRejectedEmail,
} = require('../config/email');

// --- helpers ---

const addLog = async (adminId, adminUsername, action, targetId, details) => {
  await pool.query(
    `INSERT INTO admin_logs (admin_id, admin_username, action, target_id, details)
     VALUES ($1,$2,$3,$4,$5)`,
    [adminId, adminUsername, action, targetId || null, details || null]
  );
};

const addActionHistory = async (userId, action, performedBy, reason = null, roomId = null) => {
  await pool.query(
    `INSERT INTO action_history (user_id, action, performed_by, reason, room_id)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId, action, performedBy, reason, roomId || null]
  );
};

const getUserPermissions = async (userId) => {
  const result = await pool.query(
    `SELECT permission FROM user_permissions WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map(r => r.permission);
};

// hasPermission now needs to be async since permissions are in DB
const checkPermission = async (userId, authorityLevel, permission) => {
  if (authorityLevel === 'superadmin') return true;
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
};

// --- user management ---

const getAllUsers = async (req, res) => {
  const { q, role, status } = req.query;

  let query = `
    SELECT u.id, u.full_name, u.username, u.email, u.role, u.authority_level,
           u.verification_status, u.rating, u.violation_count,
           u.suspended_until, u.suspension_reason, u.created_at, u.profile_pic_url,
           COALESCE(
             json_agg(
               json_build_object(
                 'action', ah.action,
                 'by', performer.username,
                 'reason', ah.reason,
                 'date', ah.created_at
               ) ORDER BY ah.created_at DESC
             ) FILTER (WHERE ah.id IS NOT NULL),
             '[]'
           ) AS action_history
    FROM users u
    LEFT JOIN action_history ah ON ah.user_id = u.id
    LEFT JOIN users performer ON performer.id = ah.performed_by
    WHERE 1=1
  `;
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    query += ` AND u.username ILIKE $${params.length}`;
  }
  if (role) {
    params.push(role);
    query += ` AND u.role = $${params.length}`;
  }
  if (status === 'suspended') {
    query += ` AND u.suspended_until IS NOT NULL AND u.suspended_until > NOW()`;
  }
  if (status === 'pending') {
    query += ` AND u.verification_status = 'pending'`;
  }

  query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

  const result = await pool.query(query, params);
  res.json(result.rows);
};

const suspendUser = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.SUSPEND_USERS);
  if (!allowed) return res.status(403).json({ message: 'No permission to suspend users' });

  const { userId } = req.params;
  const { days, reason } = req.body;

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.authorityLevel !== 'user') return res.status(403).json({ message: 'Cannot suspend admins' });

  const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await userRepo.updateUser(userId, {
    suspendedUntil,
    suspensionReason: reason || 'Policy violation',
    violationCount: (user.violation_count || 0) + 1,
  });

  await addActionHistory(userId, 'suspended', req.user.id, reason);
  await addLog(req.user.id, req.user.username, 'suspend_user', userId,
    `Suspended for ${days} days: ${reason}`);

  res.json({ message: `User suspended for ${days} days` });
};

const unsuspendUser = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.SUSPEND_USERS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, {
    suspendedUntil: null,
    suspensionReason: null,
  });

  await addActionHistory(userId, 'unsuspended', req.user.id);
  await addLog(req.user.id, req.user.username, 'unsuspend_user', userId, 'Suspension lifted');

  res.json({ message: 'User unsuspended' });
};

const deleteUserAccount = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can delete accounts' });
  }

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.deleteUser(userId);
  await addLog(req.user.id, req.user.username, 'delete_account', userId,
    `Deleted account @${user.username}`);

  res.json({ message: 'Account deleted' });
};

// --- professor verification ---

const getPendingProfessors = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VERIFY_PROFESSORS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(
  `SELECT id, full_name, username, email, role, verification_status, proof_file_url, university_code, university_name, created_at
   FROM users WHERE verification_status = 'pending'`
);
  res.json(result.rows);
};

const verifyProfessor = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VERIFY_PROFESSORS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, { verificationStatus: 'verified' });
  await addActionHistory(userId, 'professor_verified', req.user.id);
  await addLog(req.user.id, req.user.username, 'verify_professor', userId,
    `Verified @${user.username} as professor`);

  try {
    await sendProfessorVerificationEmail(user.email, user.username);
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  res.json({ message: 'Professor verified' });
};

const rejectProfessor = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VERIFY_PROFESSORS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { userId } = req.params;
  const { reason } = req.body;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // check if user has more than 1 major — if so, flag for reorientation
  const majorsResult = await pool.query(
    `SELECT COUNT(*) FROM user_majors WHERE user_id = $1`,
    [userId]
  );
  const majorCount = parseInt(majorsResult.rows[0].count);

  await userRepo.updateUser(userId, {
    role: 'student',
    verificationStatus: 'rejected',
    pendingReorientation: majorCount > 1,
  });

  await addActionHistory(userId, 'professor_rejected', req.user.id, reason);
  await addLog(req.user.id, req.user.username, 'reject_professor', userId,
    `Rejected @${user.username}: ${reason}`);

  try {
    await sendProfessorRejectionEmail(user.email, user.username, reason);
  } catch (err) {
    console.error('Failed to send rejection email:', err);
  }

  res.json({ message: 'Professor rejected and demoted to student' });
};

// --- content moderation ---

const getReportedContent = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.HANDLE_REPORTS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const postsResult = await pool.query(
    `SELECT p.*, COUNT(r.id) as report_count
     FROM posts p
     JOIN reports r ON r.post_id = p.id
     WHERE p.is_hidden = false  
     GROUP BY p.id
     HAVING COUNT(r.id) > 0
     ORDER BY report_count DESC`
  );

  const commentsResult = await pool.query(
    `SELECT c.*, p.title as post_title, p.id as parent_post_id, COUNT(r.id) as report_count
     FROM comments c
     JOIN reports r ON r.comment_id = c.id
     JOIN posts p ON p.id = c.post_id
     WHERE c.is_hidden = false  
     GROUP BY c.id, p.title, p.id
     HAVING COUNT(r.id) > 0
     ORDER BY report_count DESC`
  );

  res.json({
    posts: postsResult.rows,
    comments: commentsResult.rows,
  });
};

const hideContent = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MODERATE_CONTENT);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { type, postId, commentId } = req.body;

  if (type === 'post') {
    const post = await postRepo.getPostById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await postRepo.hidePost(postId);
    await addLog(req.user.id, req.user.username, 'hide_post', postId, 'Post hidden by admin');

  } else if (type === 'comment') {
    const comment = await commentRepo.getCommentById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    await commentRepo.hideComment(commentId);
    await addLog(req.user.id, req.user.username, 'hide_comment', commentId, 'Comment hidden by admin');
  }

  res.json({ message: 'Content hidden' });
};

const restoreContent = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MODERATE_CONTENT);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { type, postId, commentId } = req.body;

  if (type === 'post') {
    const post = await postRepo.getPostById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await postRepo.unhidePost(postId);
    await addLog(req.user.id, req.user.username, 'restore_post', postId, 'Post restored');

  } else if (type === 'comment') {
    const comment = await commentRepo.getCommentById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    await commentRepo.unhideComment(commentId);
    await addLog(req.user.id, req.user.username, 'restore_comment', commentId, 'Comment restored');
  }

  res.json({ message: 'Content restored' });
};

const getHiddenContent = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MODERATE_CONTENT);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const postsResult = await pool.query(
    `SELECT * FROM posts WHERE is_hidden = true ORDER BY updated_at DESC`
  );

  const commentsResult = await pool.query(
    `SELECT c.*, p.title as post_title FROM comments c
     JOIN posts p ON p.id = c.post_id
     WHERE c.is_hidden = true
     ORDER BY c.updated_at DESC`
  );

  res.json({
    posts: postsResult.rows,
    comments: commentsResult.rows,
  });
};

const getPendingResources = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.APPROVE_RESOURCES);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(
    `SELECT * FROM posts
     WHERE resource_approved IS NULL
     AND (pdf_url IS NOT NULL OR image_url IS NOT NULL OR resource_link IS NOT NULL)
     ORDER BY created_at DESC`
  );

  res.json(result.rows);
};

const approveResource = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.APPROVE_RESOURCES);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { postId, approved } = req.body;
  const post = await postRepo.getPostById(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  await postRepo.approveResource(postId, approved);
  await addLog(req.user.id, req.user.username,
    approved ? 'approve_resource' : 'reject_resource',
    postId,
    `Resource ${approved ? 'approved' : 'rejected'}`
  );

  res.json({ message: `Resource ${approved ? 'approved' : 'rejected'}` });
};

const getOtherInputs = async (req, res) => {
  const allowed = await checkPermission(
    req.user.id,
    req.user.authorityLevel,
    PERMISSIONS.VALIDATE_OTHER
  );
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  // get all users with pending custom inputs
  const usersResult = await pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.other_input_status,
            u.university_code,
            uni.name AS university_name, uni.status AS university_status
     FROM users u
     LEFT JOIN universities uni ON uni.code = u.university_code
     WHERE u.other_input_status = 'pending'
     ORDER BY u.created_at DESC`
  );

  const result = await Promise.all(usersResult.rows.map(async (user) => {
    // check if their university is custom (pending)
    const customUni = user.university_status === 'pending'
      ? { code: user.university_code, name: user.university_name }
      : null;

    // get their pending majors
    const majorsResult = await pool.query(
      `SELECT m.id, m.name FROM majors m
       JOIN user_majors um ON um.major_id = m.id
       WHERE um.user_id = $1 AND m.status = 'pending'`,
      [user.id]
    );
   

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      otherInputStatus: user.other_input_status,
      customUni,
      customMajors: majorsResult.rows.map(m => m.name),
    };
  }));

  res.json(result);
};

// const validateOtherInput = async (req, res) => {
//   const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VALIDATE_OTHER);
//   if (!allowed) return res.status(403).json({ message: 'No permission' });

//   const { userId, approved } = req.body;
//   const user = await userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: 'User not found' });

//   await userRepo.updateUser(userId, {
//     otherInputStatus: approved ? 'approved' : 'rejected',
//   });

//   await addActionHistory(userId,
//     approved ? 'other_input_approved' : 'other_input_rejected',
//     req.user.id
//   );

//   await addLog(req.user.id, req.user.username,
//     approved ? 'approve_other_input' : 'reject_other_input',
//     userId,
//     `Custom input ${approved ? 'approved' : 'rejected'} for @${user.username}`
//   );
//   if (approved) {
//   // save custom university to universities table if not already there
//   await pool.query(
//     `INSERT INTO universities (code, name)
//      VALUES ($1, $2)
//      ON CONFLICT (code) DO NOTHING`,
//     [user.university_code, user.university_name]
//   );

//   // save any custom majors to majors table if not already there
//   const userMajors = await pool.query(
//     `SELECT m.name FROM user_majors um
//      JOIN majors m ON m.id = um.major_id
//      WHERE um.user_id = $1`,
//     [userId]
//   );
//   for (const { name } of userMajors.rows) {
//     await pool.query(
//       `INSERT INTO majors (name) VALUES ($1)
//        ON CONFLICT (name) DO NOTHING`,
//       [name]
//     );
//   }
// }

// await userRepo.updateUser(userId, {
//   otherInputStatus: approved ? 'approved' : 'rejected',
// });

//   res.json({ message: `Input ${approved ? 'approved' : 'rejected'}` });
  
// };

const validateOtherInput = async (req, res) => {
  const allowed = await checkPermission(
    req.user.id,
    req.user.authorityLevel,
    PERMISSIONS.VALIDATE_OTHER
  );
  if (!allowed) return res.status(403).json({ message: 'No permission' });

let uniWasRejected = false;
let majorsWereRejected = false;


  const { userId, approved } = req.body;

  const userResult = await pool.query(
    `SELECT u.*, uni.status AS university_status
     FROM users u
     LEFT JOIN universities uni ON uni.code = u.university_code
     WHERE u.id = $1`,
    [userId]
  );

  if (!userResult.rows.length)
    return res.status(404).json({ message: 'User not found' });

  const user = userResult.rows[0];

  // fetch pending majors first — needed in both approved and rejected paths
  const pendingMajors = await pool.query(
    `SELECT m.id, m.name FROM majors m
     JOIN user_majors um ON um.major_id = m.id
     WHERE um.user_id = $1 AND m.status = 'pending'`,
    [userId]
  ); console.log("pendingMajors:", pendingMajors.rows);

  // handle university if pending
  if (user.university_status === 'pending') {
    await pool.query(
      `UPDATE universities SET status = $1 WHERE code = $2`,
      [approved ? 'approved' : 'rejected', user.university_code]
    );

    if (approved) {
      let roomRes = await pool.query(
        `SELECT id FROM rooms WHERE type = 'university' AND university_code = $1`,
        [user.university_code]
      );
      let roomId;
      if (roomRes.rows.length > 0) {
        roomId = roomRes.rows[0].id;
      } else {
        const newRoom = await pool.query(
          `INSERT INTO rooms (type, university_code, name) VALUES ('university', $1, $2) RETURNING id`,
          [user.university_code, user.university_name]
        );
        roomId = newRoom.rows[0].id;
      }
      const uniUsers = await pool.query(
        `SELECT id FROM users WHERE university_code = $1`, [user.university_code]
      );
      for (const u of uniUsers.rows) {
        await roomRepo.addMember(roomId, u.id);
      }
    } else {
      // rejected — kick user out of the pending university room
      await pool.query(
        `DELETE FROM room_members
         WHERE user_id = $1
         AND room_id IN (
           SELECT id FROM rooms WHERE type = 'university' AND university_code = $2
         )`,
        [userId, user.university_code]
      );
        //delete the refused because of bugs
         await pool.query(
    `DELETE FROM universities WHERE code = $1 AND status = 'pending'`,
    [user.university_code]
  
      );
      uniWasRejected = true;
    }
  }

  // handle pending majors
  for (const major of pendingMajors.rows) {
    await pool.query(
      `UPDATE majors SET status = $1 WHERE id = $2`,
      [approved ? 'approved' : 'rejected', major.id]
    );

    if (approved) {
      let roomRes = await pool.query(
        `SELECT id FROM rooms WHERE type = 'major' AND major_id = $1`, [major.id]
      );
      let roomId;
      if (roomRes.rows.length > 0) {
        roomId = roomRes.rows[0].id;
      } else {
        const newRoom = await pool.query(
          `INSERT INTO rooms (type, major_id, name) VALUES ('major', $1, $2) RETURNING id`,
          [major.id, major.name]
        );
        roomId = newRoom.rows[0].id;
      }
      const majorUsers = await pool.query(
        `SELECT user_id FROM user_majors WHERE major_id = $1`, [major.id]
      );
      for (const u of majorUsers.rows) {
        await roomRepo.addMember(roomId, u.user_id);
      }
    } else {
      // rejected — kick user out of the pending major room
    await pool.query(
    `DELETE FROM room_members
     WHERE user_id = $1
     AND room_id IN (
       SELECT id FROM rooms WHERE type = 'major' AND major_id = $2
     )`,
    [userId, major.id] 
  );
 // remove the major from the user entirely
  await pool.query(
    // `DELETE FROM user_majors WHERE user_id = $1 AND major_id = $2`,
  `UPDATE majors SET status = 'rejected' WHERE id = $1`,
  [major.id]
  );
  // delete the pending major from db (same as we do for universities)
  await pool.query(
    // `DELETE FROM majors WHERE id = $1 AND status = 'pending'`,
    `DELETE FROM user_majors WHERE user_id = $1 AND major_id = $2`,
  [userId, major.id]
  );
   majorsWereRejected = true; 


    }
  }
console.log("uniWasRejected:", uniWasRejected, "majorsWereRejected:", majorsWereRejected);
  // await pool.query(
  //   `UPDATE users SET other_input_status = $1 WHERE id = $2`,
  //   [approved ? 'approved' : 'rejected', userId]
  // );
await pool.query(
  `UPDATE users SET 
    other_input_status = $1,
    needs_uni_correction = $2,
    needs_major_correction = $3
   WHERE id = $4`,
  [approved ? 'approved' : 'rejected', uniWasRejected, majorsWereRejected, userId]
);

  await addLog(
    req.user.id,
    req.user.username,
    approved ? 'approve_other_input' : 'reject_other_input',
    userId,
    `Custom inputs for @${user.username} ${approved ? 'approved' : 'rejected'}`
  );

  res.json({ message: `Inputs ${approved ? 'approved' : 'rejected'}` });
};

// --- superadmin ---

const getLogs = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can view logs' });
  }

  const result = await pool.query(
    `SELECT * FROM admin_logs ORDER BY created_at DESC`
  );
  res.json(result.rows);
};

const getStats = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can view stats' });
  }

  const [users, posts, comments, rooms, suspended, pendingProfs, reportedPosts, reportedComments] =
    await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM posts`),
      pool.query(`SELECT COUNT(*) FROM comments`),
      pool.query(`SELECT COUNT(*) FROM rooms`),
      pool.query(`SELECT COUNT(*) FROM users WHERE suspended_until IS NOT NULL AND suspended_until > NOW()`),
      pool.query(`SELECT COUNT(*) FROM users WHERE verification_status = 'pending'`),
      pool.query(`SELECT COUNT(DISTINCT post_id) FROM reports WHERE post_id IS NOT NULL`),
      pool.query(`SELECT COUNT(DISTINCT comment_id) FROM reports WHERE comment_id IS NOT NULL`),
    ]);

  res.json({
    totalUsers:        parseInt(users.rows[0].count),
    totalPosts:        parseInt(posts.rows[0].count),
    totalComments:     parseInt(comments.rows[0].count),
    totalRooms:        parseInt(rooms.rows[0].count),
    suspendedUsers:    parseInt(suspended.rows[0].count),
    pendingProfessors: parseInt(pendingProfs.rows[0].count),
    reportedContent:   parseInt(reportedPosts.rows[0].count) + parseInt(reportedComments.rows[0].count),
  });
};

const getAnnouncements = async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, u.username as created_by_username 
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     ORDER BY a.created_at DESC`
  );
  res.json(result.rows);
};

const createAnnouncement = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can create announcements' });
  }

  const { message } = req.body;
  const result = await pool.query(
    `INSERT INTO announcements (message, created_by) VALUES ($1,$2) RETURNING *`,
    [message, req.user.id]
  );

  await addLog(req.user.id, req.user.username, 'create_announcement', null, message);
  res.status(201).json(result.rows[0]);
};

const deleteAnnouncement = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can delete announcements' });
  }

  const { id } = req.params;
  await pool.query(`DELETE FROM announcements WHERE id = $1`, [id]);
  res.json({ message: 'Announcement deleted' });
};

const getAllPostsAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'No permission' });
  }
  const result = await pool.query(`SELECT * FROM posts ORDER BY created_at DESC`);
  res.json(result.rows);
};

const getAllRoomsAdmin = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(`SELECT * FROM rooms ORDER BY created_at DESC`);
  res.json(result.rows);
};

const upgradeToAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can upgrade users' });
  }

  const { userId } = req.params;
  const { permissions = [], assignedRooms = [] } = req.body;

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, { authorityLevel: 'admin' });

  // insert permissions
  for (const permission of permissions) {
    await pool.query(
      `INSERT INTO user_permissions (user_id, permission) VALUES ($1,$2)
       ON CONFLICT (user_id, permission) DO NOTHING`,
      [userId, permission]
    );
  }

  // insert assigned rooms
  for (const roomId of assignedRooms) {
    await pool.query(
      `INSERT INTO admin_assigned_rooms (user_id, room_id) VALUES ($1,$2)
       ON CONFLICT (user_id, room_id) DO NOTHING`,
      [userId, roomId]
    );
  }

  // remove application
  await pool.query(`DELETE FROM admin_applications WHERE user_id = $1`, [userId]);

  await addActionHistory(userId, 'upgraded_to_admin', req.user.id);
  await addLog(req.user.id, req.user.username, 'upgrade_to_admin', userId,
    `Upgraded @${user.username} to admin`);

  try {
    await sendAdminApplicationAcceptedEmail(user.email, user.username);
  } catch (err) {
    console.error('Failed to send acceptance email:', err);
  }

  res.json({ message: 'User upgraded to admin' });
};

const removeAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can remove admins' });
  }

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, { authorityLevel: 'user' });

  // remove all permissions and assigned rooms
  await pool.query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM admin_assigned_rooms WHERE user_id = $1`, [userId]);

  await addActionHistory(userId, 'admin_removed', req.user.id);
  await addLog(req.user.id, req.user.username, 'remove_admin', userId,
    `Removed admin from @${user.username}`);

  res.json({ message: 'Admin removed' });
};

const upgradToSuperAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can add superadmins' });
  }

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, { authorityLevel: 'superadmin' });

  // superadmins don't need permissions rows
  await pool.query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);

  await addActionHistory(userId, 'upgraded_to_superadmin', req.user.id);
  await addLog(req.user.id, req.user.username, 'upgrade_to_superadmin', userId,
    `Upgraded @${user.username} to superadmin`);

  res.json({ message: 'User upgraded to superadmin' });
};

const getCurrentAdmins = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can view admins' });
  }

  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.rating, u.authority_level,
            array_agg(DISTINCT up.permission) FILTER (WHERE up.permission IS NOT NULL) as permissions,
            array_agg(DISTINCT aar.room_id) FILTER (WHERE aar.room_id IS NOT NULL) as assigned_rooms
     FROM users u
     LEFT JOIN user_permissions up ON up.user_id = u.id
     LEFT JOIN admin_assigned_rooms aar ON aar.user_id = u.id
     WHERE u.authority_level IN ('admin', 'superadmin')
     GROUP BY u.id`
  );
  res.json(toCamel(result.rows));
};

const editAdminPermissions = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can edit permissions' });
  }

  const { userId } = req.params;
  const { permissions = [], assignedRooms = [] } = req.body;

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // replace permissions — delete all then reinsert
  await pool.query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);
  for (const permission of permissions) {
    await pool.query(
      `INSERT INTO user_permissions (user_id, permission) VALUES ($1,$2)`,
      [userId, permission]
    );
  }

  // replace assigned rooms
  await pool.query(`DELETE FROM admin_assigned_rooms WHERE user_id = $1`, [userId]);
  for (const roomId of assignedRooms) {
    await pool.query(
      `INSERT INTO admin_assigned_rooms (user_id, room_id) VALUES ($1,$2)`,
      [userId, roomId]
    );
  }

  await addActionHistory(userId, 'permissions_edited', req.user.id);
  await addLog(req.user.id, req.user.username, 'edit_admin_permissions', userId,
    `Updated permissions for @${user.username}: ${permissions.join(', ')}`);

  res.json({ message: 'Permissions updated' });
};

// --- admin applications ---

// const applyForAdmin = async (req, res) => {
//   const user = await userRepo.findById(req.user.id);
//   if (!user) return res.status(404).json({ message: 'User not found' });

//   if (parseFloat(user.rating) < 3.5) {
//     return res.status(403).json({ message: 'Rating too low to apply' });
//   }

//   if (user.authorityLevel !== 'user') {
//     return res.status(400).json({ message: 'Already an admin' });
//   }

//   try {
//     await pool.query(
//       `INSERT INTO admin_applications (user_id, username, email, rating)
//        VALUES ($1,$2,$3,$4)`,
//       [user.id, user.username, user.email, user.rating]
//     );
//     res.json({ message: 'Application submitted!' });
//   } catch (err) {
//     if (err.code === '23505') {
//       return res.status(400).json({ message: 'You already have a pending application' });
//     }
//     throw err;
//   }
// };
const applyForAdmin = async (req, res) => {
  console.log("applyForAdmin body:", req.body);

  const { interests = [], reason = null } = req.body;
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (parseFloat(user.rating) < 3.5) {
    return res.status(403).json({ message: 'Rating too low to apply' });
  }

  if (user.authority_level !== 'user') {
    return res.status(400).json({ message: 'Already an admin' });
  }


  if (!interests.length) {
    return res.status(400).json({ message: 'Please select at least one area of interest' });
  }
     console.log("user found:", user?.id, "rating:", user?.rating, "authority:", user?.authority_level, "interests:", req.body.interests);


  try {
    await pool.query(
      `INSERT INTO admin_applications (user_id, username, email, rating, interests, reason)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [user.id, user.username, user.email, user.rating, interests, reason]
    );
    res.json({ message: 'Application submitted!' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'You already have a pending application' });
    }
    throw err;
  }
};

const withdrawApplication = async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM admin_applications WHERE user_id = $1`,
    [req.user.id]
  );
  const app = result.rows[0];
  if (!app) return res.status(404).json({ message: 'No application found' });

  const hoursSince = (Date.now() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60);
  if (hoursSince > 2) {
    return res.status(403).json({
      message: 'Withdrawal window has passed. Please contact a superadmin to remove your application.'
    });
  }

  await pool.query(`DELETE FROM admin_applications WHERE user_id = $1`, [req.user.id]);
  res.json({ message: 'Application withdrawn.' });
};

const getApplications = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can view applications' });
  }

 const result = await pool.query(
  `SELECT 
     aa.*,
     u.role,
     u.violation_count,
     u.created_at AS member_since,
     COALESCE(
       json_agg(
         json_build_object(
           'action', ah.action,
           'by', performer.username,
           'reason', ah.reason,
           'date', ah.created_at
         ) ORDER BY ah.created_at DESC
       ) FILTER (WHERE ah.id IS NOT NULL),
       '[]'
     ) AS action_history
   FROM admin_applications aa
   JOIN users u ON u.id = aa.user_id
   LEFT JOIN action_history ah ON ah.user_id = aa.user_id
   LEFT JOIN users performer ON performer.id = ah.performed_by
   GROUP BY aa.id, u.role, u.violation_count, u.created_at
   ORDER BY aa.applied_at DESC`
);
  res.json(toCamel(result.rows));
};


const rejectApplication = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can reject applications' });
  }

  const { userId, reason } = req.body;

  const result = await pool.query(
    `SELECT * FROM admin_applications WHERE user_id = $1`,
    [userId]
  );
  const app = result.rows[0];
  if (!app) return res.status(404).json({ message: 'Application not found' });

  await pool.query(`DELETE FROM admin_applications WHERE user_id = $1`, [userId]);

  const user = await userRepo.findById(userId);
  await addLog(req.user.id, req.user.username, 'reject_admin_application', userId,
    `Rejected admin application from @${app.username}: ${reason}`);

  try {
    await sendAdminApplicationRejectedEmail(user.email, user.username, reason);
  } catch (err) {
    console.error('Failed to send rejection email:', err);
  }

  res.json({ message: 'Application rejected.' });
};

// --- room requests ---

// const requestSubjectRoom = async (req, res) => {
//   const user = await userRepo.findById(req.user.id);
//   if (!user) return res.status(404).json({ message: 'User not found' });

//   const { majorId, subject } = req.body;
//   if (!majorId || !subject) return res.status(400).json({ message: 'Major and subject are required' });

//   // verify user is enrolled in this major
//   const majorCheck = await pool.query(
//     `SELECT m.name FROM user_majors um
//      JOIN majors m ON m.id = um.major_id
//      WHERE um.user_id = $1 AND um.major_id = $2`,
//     [req.user.id, majorId]
//   );
//   if (majorCheck.rows.length === 0) {
//     return res.status(403).json({ message: 'You can only request rooms for your own majors' });
//   }
//   const majorName = majorCheck.rows[0].name;

//   // check for duplicate pending request
//   const duplicate = await pool.query(
//     `SELECT * FROM room_requests
//      WHERE major = $1 AND LOWER(subject) = LOWER($2) AND status = 'pending'`,
//     [majorName, subject]
//   );

//   if (duplicate.rows.length > 0) {
//     const existingRequest = duplicate.rows[0];
//     // add user to notify list if not already there
//     await pool.query(
//       `INSERT INTO room_request_notify (request_id, user_id, email)
//        VALUES ($1,$2,$3)
//        ON CONFLICT (request_id, user_id) DO NOTHING`,
//       [existingRequest.id, req.user.id, user.email]
//     );
//     return res.status(200).json({
//       message: "A request for this room is already pending. You'll be notified when it's approved."
//     });
//   }

//   // create new request
//   const newRequest = await pool.query(
//     `INSERT INTO room_requests (requested_by, major, subject, email, username)
//      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
//     [req.user.id, majorName, subject, user.email, user.username]
//   );

//   // add requester to notify list
//   await pool.query(
//     `INSERT INTO room_request_notify (request_id, user_id, email)
//      VALUES ($1,$2,$3)`,
//     [newRequest.rows[0].id, req.user.id, user.email]
//   );

//   res.json({ message: "Room request submitted! You'll be notified when it's reviewed." });
// };

const requestSubjectRoom = async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { majorId, subject } = req.body;
  if (!majorId || !subject) return res.status(400).json({ message: 'Major and subject are required' });

  const majorCheck = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1 AND um.major_id = $2`,
    [req.user.id, majorId]
  );
  if (majorCheck.rows.length === 0) {
    return res.status(403).json({ message: 'You can only request rooms for your own majors' });
  }
  const majorName = majorCheck.rows[0].name;

  // superadmin skips the queue
  if (req.user.authorityLevel === 'superadmin') {
    const room = await roomRepo.createRoom({
      name: subject,
      type: 'subject',
      majorId,
      createdBy: req.user.id,
    });
      await roomRepo.addMember(room.id, req.user.id);

  await addLog(req.user.id, req.user.username, 'create_subject_room', room.id,
    `Directly created subject room "${subject}" under ${majorName}`);
  return res.status(201).json({ message: `Room "${subject}" created.`, room });

  
    await addLog(req.user.id, req.user.username, 'create_subject_room', room.id,
      `Directly created subject room "${subject}" under ${majorName}`);
    return res.status(201).json({ message: `Room "${subject}" created.`, room });
  }

  // everyone else goes through the normal queue below
  const duplicate = await pool.query(
    `SELECT * FROM room_requests
     WHERE major = $1 AND LOWER(subject) = LOWER($2) AND status = 'pending'`,
    [majorName, subject]
  );

  if (duplicate.rows.length > 0) {
    const existingRequest = duplicate.rows[0];
    await pool.query(
      `INSERT INTO room_request_notify (request_id, user_id, email)
       VALUES ($1,$2,$3)
       ON CONFLICT (request_id, user_id) DO NOTHING`,
      [existingRequest.id, req.user.id, user.email]
    );
    return res.status(200).json({
      message: "A request for this room is already pending. You'll be notified when it's approved."
    });
  }

  const newRequest = await pool.query(
    `INSERT INTO room_requests (requested_by, major, subject, email, username)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, majorName, subject, user.email, user.username]
  );

  await pool.query(
    `INSERT INTO room_request_notify (request_id, user_id, email)
     VALUES ($1,$2,$3)`,
    [newRequest.rows[0].id, req.user.id, user.email]
  );

  res.json({ message: "Room request submitted! You'll be notified when it's reviewed." });
};

const getRoomRequests = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(
`SELECT 
      rr.*,
      COALESCE(
        JSON_AGG(rrn.user_id) FILTER (WHERE rrn.user_id IS NOT NULL),
        '[]'
      ) AS "notifyUsers" 
     FROM room_requests rr
     LEFT JOIN room_request_notify rrn ON rrn.request_id = rr.id
     WHERE rr.status = 'pending'
     GROUP BY rr.id
     ORDER BY rr.requested_at DESC`  );
  res.json(result.rows);
};

const handleRoomRequest = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { requestId, approved, reason } = req.body;

  const requestResult = await pool.query(
    `SELECT * FROM room_requests WHERE id = $1`,
    [requestId]
  );
  const request = requestResult.rows[0];
  if (!request) return res.status(404).json({ message: 'Request not found' });

  await pool.query(
    `UPDATE room_requests SET status = $1 WHERE id = $2`,
    [approved ? 'approved' : 'rejected', requestId]
  );

  if (approved) {
    // get major_id
    const majorResult = await pool.query(
      `SELECT id FROM majors WHERE name = $1`,
      [request.major]
    );
    const majorId = majorResult.rows[0]?.id || null;

    // create the room
    const room = await roomRepo.createRoom({
      name: request.subject,
      type: 'subject',
      majorId,
      createdBy: null,
    });

    // get all notify users
    const notifyUsers = await pool.query(
      `SELECT user_id, email FROM room_request_notify WHERE request_id = $1`,
      [requestId]
    );

    // add each as member and send email
    for (const { user_id, email } of notifyUsers.rows) {
      await roomRepo.addMember(room.id, user_id);
      const u = await userRepo.findById(user_id);
      if (u) {
        try {
          await sendRoomRequestApprovedEmail(email, u.username, request.subject, request.major);
        } catch (err) {
          console.error('Failed to send approval email:', err);
        }
      }
    }

    await addLog(req.user.id, req.user.username, 'approve_room_request', requestId,
      `Approved room "${request.subject}" under ${request.major}`);

  } else {
    try {
      await sendRoomRequestRejectedEmail(
        request.email, request.username, request.subject, request.major, reason
      );
    } catch (err) {
      console.error('Failed to send rejection email:', err);
    }

    await addLog(req.user.id, req.user.username, 'reject_room_request', requestId,
      `Rejected room "${request.subject}" under ${request.major}: ${reason}`);
  }

  res.json({ message: approved ? 'Room created and users notified.' : 'Request rejected.' });
};

// --- room moderation ---

// const getRoomsForAdmin = async (req, res) => {
//   let roomsResult;

//   if (req.user.authorityLevel === 'superadmin') {
//     roomsResult = await pool.query(`SELECT * FROM rooms ORDER BY created_at DESC`);
//   } else {
//     const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
//     if (!allowed) return res.status(403).json({ message: 'No permission' });

//     roomsResult = await pool.query(
//       `SELECT r.* FROM rooms r
//        JOIN admin_assigned_rooms aar ON aar.room_id = r.id
//        WHERE aar.user_id = $1
//        ORDER BY r.created_at DESC`,
//       [req.user.id]
//     );
//   }

//   const rooms = roomsResult.rows;

//   // attach members and suspensions to each room
//   const enriched = await Promise.all(rooms.map(async (room) => {
//     const membersResult = await pool.query(
//       `SELECT user_id FROM room_members WHERE room_id = $1`,
//       [room.id]
//     );
//     const suspensionsResult = await pool.query(
//      `SELECT user_id, suspended_until, reason FROM room_suspensions 
//    WHERE room_id = $1 AND suspended_until > NOW()`,
//       [room.id]
//     );

//     return {
//       ...room,
//       members: membersResult.rows.map(r => r.user_id),
//       suspendedMembers: suspensionsResult.rows.map(r => ({
//         userId: r.user_id,
//          until: r.suspended_until,
//         reason: r.reason
//       }))
//     };
//   }));

//   res.json(enriched);
// };


const getRoomsForAdmin = async (req, res) => {
  let roomsResult;

  const baseQuery = `
    SELECT r.* FROM rooms r
    WHERE r.type != 'private'
    AND (
      -- public rooms have no university/major, always show
      (r.university_code IS NULL AND r.major_id IS NULL)
      OR
      -- university rooms: only if university is approved
      (r.university_code IS NOT NULL AND r.major_id IS NULL
        AND EXISTS (
          SELECT 1 FROM universities u 
          WHERE u.code = r.university_code AND u.status = 'approved'
        )
      )
      OR
      -- major/subject rooms: only if major is approved
      (r.major_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM majors m 
          WHERE m.id = r.major_id AND m.status = 'approved'
        )
      )
    )
  `;

  if (req.user.authorityLevel === 'superadmin') {
    roomsResult = await pool.query(`${baseQuery} ORDER BY r.created_at DESC`);
  } else {
    const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
    if (!allowed) return res.status(403).json({ message: 'No permission' });

    roomsResult = await pool.query(
      `${baseQuery}
       AND r.id IN (
         SELECT room_id FROM admin_assigned_rooms WHERE user_id = $1
       )
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
  }

  const rooms = roomsResult.rows;

  const enriched = await Promise.all(rooms.map(async (room) => {
    const membersResult = await pool.query(
      `SELECT user_id FROM room_members WHERE room_id = $1`,
      [room.id]
    );
    const suspensionsResult = await pool.query(
      `SELECT user_id, suspended_until, reason FROM room_suspensions 
       WHERE room_id = $1 AND suspended_until > NOW()`,
      [room.id]
    );

    return {
      ...room,
      members: membersResult.rows.map(r => r.user_id),
      suspendedMembers: suspensionsResult.rows.map(r => ({
        userId: r.user_id,
        until: r.suspended_until,
        reason: r.reason
      }))
    };
  }));

  res.json(enriched);
};

const suspendFromRoom = async (req, res) => {
  const { roomId, userId, days, reason } = req.body;

  if (req.user.authorityLevel !== 'superadmin') {
    const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
    if (!allowed) return res.status(403).json({ message: 'No permission' });

    const assignedCheck = await pool.query(
      `SELECT 1 FROM admin_assigned_rooms WHERE user_id = $1 AND room_id = $2`,
      [req.user.id, roomId]
    );
    if (assignedCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to this room' });
    }
  }

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await roomRepo.suspendMemberFromRoom(roomId, userId, until, reason);

  await userRepo.updateUser(userId, {
    violationCount: (user.violation_count || 0) + 1,
  });

  await addActionHistory(userId, 'room_suspended', req.user.id, reason, roomId);
  await addLog(req.user.id, req.user.username, 'room_suspend', userId,
    `Suspended @${user.username} from room ${roomId} for ${days} days: ${reason}`);

  res.json({ message: `User suspended from room for ${days} days` });
};

const unsuspendFromRoom = async (req, res) => {
  const { roomId, userId } = req.body;

  if (req.user.authorityLevel !== 'superadmin') {
    const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
    if (!allowed) return res.status(403).json({ message: 'No permission' });

    const assignedCheck = await pool.query(
      `SELECT 1 FROM admin_assigned_rooms WHERE user_id = $1 AND room_id = $2`,
      [req.user.id, roomId]
    );
    if (assignedCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to this room' });
    }
  }

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await roomRepo.unsuspendMemberFromRoom(roomId, userId);
  await addActionHistory(userId, 'room_unsuspended', req.user.id, null, roomId);
  await addLog(req.user.id, req.user.username, 'room_unsuspend', userId,
    `Lifted room suspension for @${user.username} in room ${roomId}`);

  res.json({ message: 'Room suspension lifted' });
};

const deleteRoomAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can delete rooms' });
  }

  const { roomId } = req.params;
  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  // block deletion of public rooms
  if (room.type === 'public') {
    return res.status(403).json({ message: 'Public rooms cannot be deleted.' });
  }

  await pool.query(`DELETE FROM rooms WHERE id = $1`, [roomId]);
  await addLog(req.user.id, req.user.username, 'delete_room', roomId,
    `Deleted room "${room.name}"`);

  res.json({ message: 'Room deleted' });
};

// --- override ---

const overrideLog = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can override actions' });
  }

  const { logId } = req.params;
  const { reason } = req.body;

  if (!reason?.trim()) return res.status(400).json({ message: 'Override reason is required' });

  const logResult = await pool.query(`SELECT * FROM admin_logs WHERE id = $1`, [logId]);
  const log = logResult.rows[0];
  if (!log) return res.status(404).json({ message: 'Log not found' });
  if (log.overridden_by) return res.status(400).json({ message: 'This action has already been overridden' });

  try {
    switch (log.action) {

      case 'suspend_user': {
        const user = await userRepo.findById(log.target_id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await userRepo.updateUser(log.target_id, {
          suspendedUntil: null,
          suspensionReason: null,
        });
        await addActionHistory(log.target_id, 'suspension_overridden', req.user.id, reason);
        break;
      }

      case 'hide_post': {
        const post = await postRepo.getPostById(log.target_id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        await postRepo.unhidePost(log.target_id);
        break;
      }

      case 'hide_comment': {
        const comment = await commentRepo.getCommentById(log.target_id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        await commentRepo.unhideComment(log.target_id);
        break;
      }

      case 'room_suspend': {
        const user = await userRepo.findById(log.target_id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // extract roomId from details string
        const roomIdMatch = log.details.match(/from room (\S+) for/);
        if (!roomIdMatch) return res.status(400).json({ message: 'Could not parse room ID from log' });

        await roomRepo.unsuspendMemberFromRoom(roomIdMatch[1], log.target_id);
        await addActionHistory(log.target_id, 'room_suspension_overridden', req.user.id, reason, roomIdMatch[1]);
        break;
      }

      case 'approve_resource':
      case 'reject_resource': {
        const post = await postRepo.getPostById(log.target_id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        await postRepo.approveResource(log.target_id, log.action === 'approve_resource' ? false : null);
        break;
      }

      default:
        return res.status(400).json({ message: `Action "${log.action}" is not overridable` });
    }

  } catch (err) {
    console.error('Override error:', err);
    return res.status(500).json({ message: 'Override failed' });
  }

  // mark log as overridden — add columns if not there yet
  await pool.query(
    `UPDATE admin_logs SET
       overridden_by = $1,
       override_reason = $2,
       overridden_at = NOW()
     WHERE id = $3`,
    [req.user.username, reason, logId]
  );

  await addLog(req.user.id, req.user.username, 'override_action', log.target_id,
    `Overrode "${log.action}" (log #${log.id}): ${reason}`);

  res.json({ message: 'Action overridden successfully' });
};


const getAllCommentsAdmin = async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, p.title as post_title 
     FROM comments c
     LEFT JOIN posts p ON p.id = c.post_id
     ORDER BY c.created_at DESC`
  );
  res.json(toCamel(result.rows));
};

// --- exports ---

module.exports = {
  getAllUsers,
  suspendUser,
  unsuspendUser,
  deleteUserAccount,
  getPendingProfessors,
  verifyProfessor,
  rejectProfessor,
  getReportedContent,
  hideContent,
  restoreContent,
  getHiddenContent,
  getPendingResources,
  approveResource,
  getOtherInputs,
  validateOtherInput,
  getLogs,
  getStats,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAllPostsAdmin,
  getAllRoomsAdmin,
  upgradeToAdmin,
  removeAdmin,
  upgradToSuperAdmin,
  getCurrentAdmins,
  editAdminPermissions,
  applyForAdmin,
  withdrawApplication,
  getApplications,
  rejectApplication,
  requestSubjectRoom,
  getRoomRequests,
  handleRoomRequest,
  getRoomsForAdmin,
  suspendFromRoom,
  unsuspendFromRoom,
  deleteRoomAdmin,
  overrideLog,
  getAllCommentsAdmin,
};