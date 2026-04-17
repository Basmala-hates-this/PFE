const pool = require('../db');

const getPostVote = async (userId, postId) => {
  const result = await pool.query(
    `SELECT * FROM votes WHERE user_id = $1 AND post_id = $2`,
    [userId, postId]
  );
  return result.rows[0] || null;
};

const getCommentVote = async (userId, commentId) => {
  const result = await pool.query(
    `SELECT * FROM votes WHERE user_id = $1 AND comment_id = $2`,
    [userId, commentId]
  );
  return result.rows[0] || null;
};

const getVoteCountsForPost = async (postId) => {
  const result = await pool.query(
    `SELECT * FROM post_vote_counts WHERE post_id = $1`,
    [postId]
  );
  return result.rows[0] || { useful: 0, useless: 0 };
};

const getVoteCountsForComment = async (commentId) => {
  const result = await pool.query(
    `SELECT * FROM comment_vote_counts WHERE comment_id = $1`,
    [commentId]
  );
  return result.rows[0] || { useful: 0, useless: 0, specialized: 0 };
};

const votePost = async (postId, userId, voteType) => {
  // check author
  const postResult = await pool.query(`SELECT user_id FROM posts WHERE id = $1`, [postId]);
  const post = postResult.rows[0];
  if (!post) return null;
  if (post.user_id === userId) return { error: 'Cannot vote on your own post' };

  const existing = await getPostVote(userId, postId);

  if (!existing) {
    // new vote
    await pool.query(
      `INSERT INTO votes (user_id, post_id, type) VALUES ($1,$2,$3)`,
      [userId, postId, voteType]
    );
    await pool.query(`SELECT update_user_rating($1)`, [post.user_id]);
  } else if (existing.type === voteType) {
    // same vote = remove
    await pool.query(`DELETE FROM votes WHERE id = $1`, [existing.id]);
    await pool.query(`SELECT update_user_rating($1)`, [post.user_id]);
  } else {
    // switch vote type
    await pool.query(`UPDATE votes SET type = $1 WHERE id = $2`, [voteType, existing.id]);
    await pool.query(`SELECT update_user_rating($1)`, [post.user_id]);
  }

  return await getVoteCountsForPost(postId);
};

const voteComment = async (commentId, userId, voteType) => {
  // check author
  const commentResult = await pool.query(`SELECT user_id FROM comments WHERE id = $1`, [commentId]);
  const comment = commentResult.rows[0];
  if (!comment) return null;
  if (comment.user_id === userId) return { error: 'Cannot vote on your own comment' };

  const existing = await getCommentVote(userId, commentId);

  if (!existing) {
    await pool.query(
      `INSERT INTO votes (user_id, comment_id, type) VALUES ($1,$2,$3)`,
      [userId, commentId, voteType]
    );
    await pool.query(`SELECT update_user_rating($1)`, [comment.user_id]);
  } else if (existing.type === voteType) {
    await pool.query(`DELETE FROM votes WHERE id = $1`, [existing.id]);
    await pool.query(`SELECT update_user_rating($1)`, [comment.user_id]);
  } else {
    await pool.query(`UPDATE votes SET type = $1 WHERE id = $2`, [voteType, existing.id]);
    await pool.query(`SELECT update_user_rating($1)`, [comment.user_id]);
  }

  return await getVoteCountsForComment(commentId);
};

const getUserVotesForPosts = async (userId, postIds) => {
  if (!postIds || postIds.length === 0) return [];
  const result = await pool.query(
    `SELECT post_id, type FROM votes WHERE user_id = $1 AND post_id = ANY($2::uuid[])`,
    [userId, postIds]
  );
  return result.rows;
};

const getUserVotesForComments = async (userId, commentIds) => {
  if (!commentIds || commentIds.length === 0) return [];
  const result = await pool.query(
    `SELECT comment_id, type FROM votes WHERE user_id = $1 AND comment_id = ANY($2::uuid[])`,
    [userId, commentIds]
  );
  return result.rows;
};

module.exports = {
  votePost,
  voteComment,
  getVoteCountsForPost,
  getVoteCountsForComment,
  getUserVotesForPosts,
  getUserVotesForComments,
};