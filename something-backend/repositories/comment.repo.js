const toCamel = require('../utils/toCamel');
const pool = require('../db');

const createComment = async (commentData) => {
  const result = await pool.query(
    `INSERT INTO comments
      (post_id, user_id, author_username, content, parent_comment_id, image_url, pdf_url,video_url, resource_link, resource_label)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      commentData.postId,
      commentData.authorId,
      commentData.authorUsername,
      commentData.content,
      commentData.parentCommentId || null,
      commentData.image || null,
      commentData.pdf || null,
      commentData.video || null, 
      commentData.resourceLink || null,
      commentData.resourceLabel || null,
    ]
  );
  return toCamel(result.rows[0]);
};

const getCommentById = async (id) => {
  const result = await pool.query(`SELECT * FROM comments WHERE id = $1`, [id]);
  return toCamel(result.rows[0]) || null;
};

const getCommentsByPost = async (postId) => {
  const result = await pool.query(
    `SELECT c.*,
      COALESCE(v.useful, 0)::int as vote_useful,
      COALESCE(v.useless, 0)::int as vote_useless,
      COALESCE(v.specialized, 0)::int as vote_specialized,
      u.profile_pic_url as author_profile_pic
     FROM comments c
     LEFT JOIN comment_vote_counts v ON v.comment_id = c.id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  );
  return toCamel(result.rows);
};

const getCommentsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM comments WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return toCamel(result.rows);
};

const updateComment = async (commentId, userId, content) => {
  const comment = await getCommentById(commentId);
  if (!comment) return null;
  if (comment.userId !== userId) return { error: 'Not authorized to edit this comment' };

  const result = await pool.query(
    `UPDATE comments SET content = $1, is_updated = true WHERE id = $2 RETURNING *`,
    [content, commentId]
  );
  return toCamel(result.rows[0]) ;
};

const deleteComment = async (commentId, userId) => {
  const comment = await getCommentById(commentId);
  if (!comment) return false;
  if (comment.userId !== userId) return { error: 'Not authorized to delete this comment' };

  await pool.query(`DELETE FROM comments WHERE id = $1`, [commentId]);
  return true;
};

const hideComment = async (commentId) => {
  await pool.query(
    `UPDATE comments SET is_hidden = true WHERE id = $1`,
    [commentId]
  );
};

const unhideComment = async (commentId) => {
  await pool.query(
    `UPDATE comments SET is_hidden = false, auto_hidden = false WHERE id = $1`,
    [commentId]
  );
};

module.exports = {
  createComment,
  getCommentById,
  getCommentsByPost,
  getCommentsByUser,
  updateComment,
  deleteComment,
  hideComment,
  unhideComment,
};