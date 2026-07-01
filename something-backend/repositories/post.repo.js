const toCamel = require('../utils/toCamel');
const pool = require('../db');

const createPost = async (postData) => {
  const result = await pool.query(
    `INSERT INTO posts 
      (room_id, user_id, author_username, author_role, title, content, image_url, pdf_url,video_url, resource_link, resource_label)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      postData.roomId,
      postData.authorId,
      postData.authorUsername,
      postData.authorRole,
      postData.title || null,
      postData.content,
      postData.image || null,
      postData.pdf || null,
      postData.video || null, 
      postData.resourceLink || null,
      postData.resourceLabel || null,
    ]
  );
  return toCamel(result.rows[0]);
};

const getPostById = async (id, userId = null) => {
  const result = await pool.query(
    `SELECT p.*,
      COALESCE(v.useful, 0) as vote_useful,
      COALESCE(v.useless, 0) as vote_useless,
      COUNT(DISTINCT c.id) as comment_count,
      u.profile_pic_url as author_profile_pic,
(SELECT type FROM votes WHERE post_id = p.id AND user_id = $2) as user_vote
     FROM posts p
     LEFT JOIN post_vote_counts v ON v.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.id = $1
     GROUP BY p.id, v.useful, v.useless, u.profile_pic_url`,
    [id, userId]
  );
  return toCamel(result.rows[0]) || null;
};

// const getPostsByRoom = async (roomId, userId = null) => {
//   const result = await pool.query(
//     `SELECT p.*,
//       COALESCE(v.useful, 0) as vote_useful,
//       COALESCE(v.useless, 0) as vote_useless,
//       COUNT(DISTINCT c.id) as comment_count,
//       u.profile_pic_url as author_profile_pic,
// (SELECT type FROM votes WHERE post_id = p.id AND user_id = $2) as user_vote
//      FROM posts p
//      LEFT JOIN post_vote_counts v ON v.post_id = p.id
//      LEFT JOIN comments c ON c.post_id = p.id
//      LEFT JOIN users u ON u.id = p.user_id
//      WHERE p.room_id = $1
//      GROUP BY p.id, v.useful, v.useless, u.profile_pic_url
//      ORDER BY p.created_at DESC`,
//     [roomId, userId]
//   );
//   return toCamel(result.rows);
// };
const getPostsByRoom = async (roomId, userId = null, { limit = 20, cursorCreatedAt = null, cursorId = null } = {}) => {
  const params = [roomId, userId];
  let cursorClause = "";
  if (cursorCreatedAt && cursorId) {
    params.push(cursorCreatedAt, cursorId);
    cursorClause = `AND (p.created_at, p.id) < ($3, $4)`;
  }
  params.push(limit);
  const limitParamIndex = params.length;

  const result = await pool.query(
    `SELECT p.*,
      COALESCE(v.useful, 0) as vote_useful,
      COALESCE(v.useless, 0) as vote_useless,
      COUNT(DISTINCT c.id) as comment_count,
      u.profile_pic_url as author_profile_pic,
      (SELECT type FROM votes WHERE post_id = p.id AND user_id = $2) as user_vote
     FROM posts p
     LEFT JOIN post_vote_counts v ON v.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.room_id = $1
     ${cursorClause}
     GROUP BY p.id, v.useful, v.useless, u.profile_pic_url
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $${limitParamIndex}`,
    params
  );

  const posts = toCamel(result.rows);
  const nextCursor = result.rows.length === Number(limit)
    ? { createdAt: result.rows[result.rows.length - 1].created_at, id: result.rows[result.rows.length - 1].id }
    : null;

  return { posts, nextCursor };
};

const getPostsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT p.*,
      COALESCE(v.useful, 0) as vote_useful,
      COALESCE(v.useless, 0) as vote_useless,
      COUNT(DISTINCT c.id) as comment_count
     FROM posts p
     LEFT JOIN post_vote_counts v ON v.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id, v.useful, v.useless
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return toCamel(result.rows);
};

// const updatePost = async (postId, userId, updatedData) => {
//  const post = await getPostById(postId);
// if (!post) return null;
// if (post.userId !== userId) return { error: 'Not authorized to edit this post' };

//   const result = await pool.query(
//     `UPDATE posts SET title = $1, content = $2, is_updated = true
//      WHERE id = $3 RETURNING *`,
//     [updatedData.title, updatedData.content, postId]
//   );
//   return toCamel(result.rows[0]);
// };
const updatePost = async (postId, userId, updatedData) => {
  const post = await getPostById(postId);
  if (!post) return null;
  if (post.userId !== userId) return { error: 'Not authorized to edit this post' };

  const result = await pool.query(
    `UPDATE posts 
     SET title = $1, content = $2, is_updated = true,
         image_url = $3, pdf_url = $4, video_url = $5,
         resource_link = $6, resource_label = $7
     WHERE id = $8 RETURNING *`,
    [
      updatedData.title,
      updatedData.content,
      updatedData.image ?? null,
      updatedData.pdf ?? null,
      updatedData.video ?? null,
      updatedData.resourceLink ?? null,
      updatedData.resourceLabel ?? null,
      postId,
    ]
  );
  return toCamel(result.rows[0]);
};
const deletePost = async (postId, userId) => {
  const post = await getPostById(postId);
  if (!post) return false;
if (post.userId !== userId) return { error: 'Not authorized to delete this post' };

  await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);
  return true;
};

const hidePost = async (postId) => {
  await pool.query(
    `UPDATE posts SET is_hidden = true WHERE id = $1`,
    [postId]
  );
};

const unhidePost = async (postId) => {
  await pool.query(
    `UPDATE posts SET is_hidden = false, auto_hidden = false WHERE id = $1`,
    [postId]
  );
};


const getSavedPostsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT p.*,
      COALESCE(v.useful, 0)::int as vote_useful,
COALESCE(v.useless, 0)::int as vote_useless,
      COUNT(DISTINCT c.id) as comment_count
     FROM posts p
     JOIN saved_posts sp ON sp.post_id = p.id
     LEFT JOIN post_vote_counts v ON v.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     WHERE sp.user_id = $1
     GROUP BY p.id, v.useful, v.useless, sp.saved_at
     ORDER BY sp.saved_at DESC`,
    [userId]
  );
  return toCamel(result.rows);
};

const approveResource = async (postId, approved) => {
  const result = await pool.query(
    `UPDATE posts SET resource_approved = $1 WHERE id = $2 RETURNING *`,
    [approved, postId]
  );
 return toCamel(result.rows[0]);
};

module.exports = {
  createPost, 
  getPostById,
  getPostsByRoom,
  getPostsByUser,
  updatePost,
  deletePost,
  hidePost,
  unhidePost,
  getSavedPostsByUser,
  approveResource,
};