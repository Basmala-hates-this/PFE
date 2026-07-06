const pool = require('../db');
const toCamel = require('../utils/toCamel');

const createEndorsement = async ({ endorserId, endorseeId, postId, roomId, commentId }) => {
  try {
    const result = await pool.query(
      `INSERT INTO peer_endorsements (endorser_id, endorsee_id, post_id, room_id, comment_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [endorserId, endorseeId, postId, roomId, commentId]
    );
    return toCamel(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // unique_violation — already endorsed this person in this room
      return { error: 'You have already endorsed this person in this subject.' };
    }
    throw err;
  }
};

const getEndorsementCountForUserInRoom = async (userId, roomId) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM peer_endorsements
     WHERE endorsee_id = $1 AND room_id = $2`,
    [userId, roomId]
  );
  return Number(result.rows[0].count);
};

const getEndorsementsForUser = async (userId) => {
  const result = await pool.query(
    `SELECT pe.*, r.name as room_name, p.title as post_title
     FROM peer_endorsements pe
     JOIN rooms r ON r.id = pe.room_id
     JOIN posts p ON p.id = pe.post_id
     WHERE pe.endorsee_id = $1
     ORDER BY pe.created_at DESC`,
    [userId]
  );
  return toCamel(result.rows);
};

const getCommentWithPostContext = async (commentId) => {
  const result = await pool.query(
    `SELECT c.id as comment_id, c.user_id as comment_author_id, c.post_id,
            p.user_id as post_author_id, p.room_id
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     WHERE c.id = $1`,
    [commentId]
  );
  return toCamel(result.rows[0]) || null;
};

module.exports = {
  createEndorsement,
  getEndorsementCountForUserInRoom,
  getEndorsementsForUser,
  getCommentWithPostContext,
};