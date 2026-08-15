const toCamel = require('../utils/toCamel');
const pool = require('../db');


const createPost = async (postData) => {
  const result = await pool.query(
    `INSERT INTO posts 
      (room_id, user_id, author_username, author_role, title, content, image_url, pdf_url, video_url, resource_link, resource_label, is_question, is_study_partner, tag, is_system_generated, from_major_id, into_major_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
      postData.isQuestion ?? false,
      postData.isStudyPartner ?? false,
      postData.tag || null,
      postData.isSystemGenerated ?? false,
      postData.fromMajorId || null,
      postData.intoMajorId || null,
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

const getPostsByRoom = async (roomId, userId = null, { limit = 20, cursorCreatedAt = null, cursorId = null, onlyQuestions = false, viewerMajorIds = null } = {}) => {
  const params = [roomId, userId];
  let cursorClause = "";
  if (cursorCreatedAt && cursorId) {
    params.push(cursorCreatedAt, cursorId);
    cursorClause = `AND (p.created_at, p.id) < ($3, $4)`;
  }
  const questionClause = onlyQuestions ? `AND p.is_question = true` : "";

  let tagClause = "";
 if (viewerMajorIds && viewerMajorIds.length > 0) {
  params.push(viewerMajorIds);
  tagClause = `AND (p.from_major_id = ANY($${params.length}) OR p.into_major_id = ANY($${params.length}) OR p.is_system_generated = true)`;
}

  params.push(limit);
  const limitParamIndex = params.length;

  const result = await pool.query(
    `SELECT p.*,
      COALESCE(v.useful, 0) as vote_useful,
      COALESCE(v.useless, 0) as vote_useless,
      COUNT(DISTINCT c.id) as comment_count,
      u.profile_pic_url as author_profile_pic,
      fm.name as from_major_name,
      im.name as into_major_name,
      (SELECT type FROM votes WHERE post_id = p.id AND user_id = $2) as user_vote
     FROM posts p
     LEFT JOIN post_vote_counts v ON v.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN majors fm ON fm.id = p.from_major_id
     LEFT JOIN majors im ON im.id = p.into_major_id
     WHERE p.room_id = $1
     ${cursorClause}
     ${questionClause}
     ${tagClause}
     GROUP BY p.id, v.useful, v.useless, u.profile_pic_url, fm.name, im.name
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


const updatePost = async (postId, userId, updatedData) => {
  const post = await getPostById(postId);
  if (!post) return null;
  if (post.userId !== userId) return { error: 'Not authorized to edit this post' };

  // fall back to existing values when a field isn't part of this edit
  const isQuestion = updatedData.isQuestion ?? post.isQuestion;
  const isAnswered = isQuestion === false 
    ? false 
    : (updatedData.isAnswered ?? post.isAnswered);

  const result = await pool.query(
    `UPDATE posts 
     SET title = $1, content = $2, is_updated = true,
         image_url = $3, pdf_url = $4, video_url = $5,
         resource_link = $6, resource_label = $7,
         is_question = $8, is_answered = $9
     WHERE id = $10 RETURNING *`,
    [
      updatedData.title,
      updatedData.content,
      updatedData.image ?? null,
      updatedData.pdf ?? null,
      updatedData.video ?? null,
      updatedData.resourceLink ?? null,
      updatedData.resourceLabel ?? null,
      isQuestion,
      isAnswered,
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

async function setQuestionFlag(postId, isQuestion) {
  const result = await pool.query(
    `UPDATE posts 
     SET is_question = $1 
     WHERE id = $2 
     RETURNING *`,
    [isQuestion, postId]
  );
  return result.rows[0] ? toCamel(result.rows[0]) : null;
}

async function toggleAnswered(postId) {
  const result = await pool.query(
    `UPDATE posts 
     SET is_answered = NOT is_answered 
     WHERE id = $1 AND is_question = true
     RETURNING *`,
    [postId]
  );
  return result.rows[0] ? toCamel(result.rows[0]) : null;
}

async function getPostOwnerId(postId) {
  const result = await pool.query(
    `SELECT user_id FROM posts WHERE id = $1`,
    [postId]
  );
  return result.rows[0]?.user_id ?? null;
}



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
  // setQuestionFlag,
  toggleAnswered,
  getPostOwnerId,
};