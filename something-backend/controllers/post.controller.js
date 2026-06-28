const postRepo = require('../repositories/post.repo');
const commentRepo = require('../repositories/comment.repo');
const voteRepo = require('../repositories/vote.repo');
const roomRepo = require('../repositories/room.repo');
const userRepo = require('../repositories/user.repo');
const pool = require('../db');
const toCamel = require('../utils/toCamel');
const notifService = require('../services/notificationService');

// --- suspension check ---
const isUserSuspendedInRoom = async (roomId, userId) => {
  const suspension = await roomRepo.getRoomSuspension(roomId, userId);
  if (!suspension) return false;
  return new Date(suspension.suspended_until) > new Date();
};

// --- posts ---

const createPost = async (req, res) => {
  const { title, content, roomId, resourceLink, resourceLabel } = req.body;
  const authorId = req.user.id;
  const authorUsername = req.user.username;
  const authorRole = req.user.role;

  if (await isUserSuspendedInRoom(roomId, authorId)) {
    return res.status(403).json({ message: 'You are suspended from posting in this room.' });
  }

  // const image = req.file && req.file.mimetype.startsWith('image/')
  //   ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  // const pdf = req.file && req.file.mimetype === 'application/pdf'
  //   ? `http://localhost:5000/uploads/${req.file.filename}` : null;
  //   const video = req.file && req.file.mimetype.startsWith('video/')
  // ? `http://localhost:5000/uploads/${req.file.filename}` : null;
//   const image = req.file && req.file.mimetype.startsWith('image/')
//   ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;
// const pdf = req.file && req.file.mimetype === 'application/pdf'
//   ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;
// const video = req.file && req.file.mimetype.startsWith('video/')
//   ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;
const image = req.file && req.file.mimetype.startsWith('image/') ? req.file.path : undefined;
const pdf = req.file && req.file.mimetype === 'application/pdf' ? req.file.path : undefined;
const video = req.file && req.file.mimetype.startsWith('video/') ? req.file.path : undefined;



  const newPost = await postRepo.createPost({
    title, content, roomId,
    authorId, authorUsername, authorRole,
    image, pdf,video, 
    resourceLink: resourceLink || null,
    resourceLabel: resourceLabel || null,
  });

const room = await roomRepo.getRoomById(roomId);

try {
  await notifService.notifyNewPost(roomId, authorId, authorUsername, room?.name || roomId, newPost.id, title);
} catch (notifErr) {
  console.error('Post notification failed:', notifErr);
}

  res.status(201).json(newPost);
};

const getPostById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || null; // handles guests
  const post = await postRepo.getPostById(id, userId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
};

// const getPostsAll = async (req, res) => {
//   const { roomId, sort } = req.query;

//   let posts;
//   if (roomId) {
//     if (sort === 'top') {
//       const result = await pool.query(
//         `SELECT p.*,
//   COALESCE(v.useful, 0) as vote_useful,
//   COALESCE(v.useless, 0) as vote_useless,
//   COUNT(DISTINCT c.id) as comment_count,
//   u.profile_pic_url as author_profile_pic
//  FROM posts p
//  LEFT JOIN post_vote_counts v ON v.post_id = p.id
//  LEFT JOIN comments c ON c.post_id = p.id
//  LEFT JOIN users u ON u.id = p.user_id
//  WHERE p.room_id = $1
//  GROUP BY p.id, v.useful, v.useless, u.profile_pic_url
//  ORDER BY vote_useful DESC`,
//         [roomId]
//       );
//       posts = toCamel(result.rows);
//     } else {
//       posts = await postRepo.getPostsByRoom(roomId);
//     }
//   } else {
//     const result = await pool.query(
//   `SELECT p.*,
//     COALESCE(v.useful, 0) as vote_useful,
//     COALESCE(v.useless, 0) as vote_useless,
//     COUNT(DISTINCT c.id) as comment_count,
//     u.profile_pic_url as author_profile_pic
//    FROM posts p
//    LEFT JOIN post_vote_counts v ON v.post_id = p.id
//    LEFT JOIN comments c ON c.post_id = p.id
//    LEFT JOIN users u ON u.id = p.user_id
//    GROUP BY p.id, v.useful, v.useless, u.profile_pic_url
//    ORDER BY p.created_at DESC`
// );
//     posts = toCamel(result.rows);
//   }

//   res.json(posts);
// };
const getPostsAll = async (req, res) => {
  const { roomId, sort } = req.query;
  const userId = req.user?.id || null;
 // console.log("getPostsAll userId:", userId);

  let posts;
  if (roomId) {
    posts = await postRepo.getPostsByRoom(roomId, userId);
  } else {
    const result = await pool.query(
      `SELECT p.*,
        COALESCE(v.useful, 0) as vote_useful,
        COALESCE(v.useless, 0) as vote_useless,
        COUNT(DISTINCT c.id) as comment_count,
        u.profile_pic_url as author_profile_pic,
        (SELECT type FROM votes WHERE post_id = p.id AND user_id = $1) as user_vote
       FROM posts p
       LEFT JOIN post_vote_counts v ON v.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN users u ON u.id = p.user_id
       GROUP BY p.id, v.useful, v.useless, u.profile_pic_url
       ORDER BY p.created_at DESC`,
      [userId]
    );
    posts = toCamel(result.rows);
  }

  res.json(posts);
};

// const updatePost = async (req, res) => {
//   const { id } = req.params;
//   const { title, content } = req.body;
//   const userId = req.user.id;

//   const updatedPost = await postRepo.updatePost(id, userId, { title, content });
//   if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
//   if (updatedPost.error) return res.status(403).json({ message: updatedPost.error });

//   res.json(updatedPost);
// };

const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, resourceLink, resourceLabel, removeAttachment } = req.body;
  const userId = req.user.id;

  const existing = await postRepo.getPostById(id);
  if (!existing) return res.status(404).json({ message: 'Post not found' });
  if (existing.userId !== userId) return res.status(403).json({ message: 'Not authorized' });

  // const newImage = req.file && req.file.mimetype.startsWith('image/')
  //   ? `http://localhost:5000/uploads/${req.file.filename}` : undefined;
  // const newPdf = req.file && req.file.mimetype === 'application/pdf'
  //   ? `http://localhost:5000/uploads/${req.file.filename}` : undefined;
  // const newVideo = req.file && req.file.mimetype.startsWith('video/')
  //   ? `http://localhost:5000/uploads/${req.file.filename}` : undefined;
  const newImage = req.file && req.file.mimetype.startsWith('image/')
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : undefined;
const newPdf = req.file && req.file.mimetype === 'application/pdf'
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : undefined;
const newVideo = req.file && req.file.mimetype.startsWith('video/')
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : undefined;

  const clearAttachment = removeAttachment === "true";

  const updatedPost = await postRepo.updatePost(id, userId, {
    title, content,
    resourceLink: resourceLink || null,
    resourceLabel: resourceLabel || null,
    image: newImage !== undefined ? newImage : (clearAttachment ? null : existing.imageUrl),
    pdf: newPdf !== undefined ? newPdf : (clearAttachment ? null : existing.pdfUrl),
    video: newVideo !== undefined ? newVideo : (clearAttachment ? null : existing.videoUrl),
  });

  res.json(updatedPost);
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await postRepo.deletePost(id, userId);
  if (!result) return res.status(404).json({ message: 'Post not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: 'Post deleted successfully' });
};

const votePost = async (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body;
  const userId = req.user.id;

  const post = await postRepo.getPostById(id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (await isUserSuspendedInRoom(post.room_id, userId)) {
    return res.status(403).json({ message: 'You are suspended from voting in this room.' });
  }

  const result = await voteRepo.votePost(id, userId, voteType);
  if (!result) return res.status(404).json({ message: 'Post not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json(result);
};

// --- comments ---

const addComment = async (req, res) => {
  const { postId } = req.params;
  const { content, parentCommentId, resourceLink, resourceLabel } = req.body;
  const authorId = req.user.id;
  const authorUsername = req.user.username;

  const post = await postRepo.getPostById(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (await isUserSuspendedInRoom(post.room_id, authorId)) {
    return res.status(403).json({ message: 'You are suspended from commenting in this room.' });
  }

  // const image = req.file && req.file.mimetype.startsWith('image/')
  //   ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  // const pdf = req.file && req.file.mimetype === 'application/pdf'
  //   ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  //   const video = req.file && req.file.mimetype.startsWith('video/')
  // ? `http://localhost:5000/uploads/${req.file.filename}` : null;
  const image = req.file && req.file.mimetype.startsWith('image/')
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;
const pdf = req.file && req.file.mimetype === 'application/pdf'
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;
const video = req.file && req.file.mimetype.startsWith('video/')
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;


  const comment = await commentRepo.createComment({
    postId,
    authorId,
    authorUsername,
    content,
    parentCommentId: parentCommentId || null,
    image, pdf,video,
    resourceLink: resourceLink || null,
    resourceLabel: resourceLabel || null,
  });
  try {
  if (parentCommentId) {
    // reply to a comment — notify the parent comment owner
    const parentComment = await commentRepo.getCommentById(parentCommentId);
    if (parentComment && parentComment.userId !== authorId) {
      await notifService.notifyCommentReply(parentComment.userId, authorUsername, postId, post.roomId);
    }
  } else {
    // reply to a post — notify the post owner
    if (post.userId !== authorId) {
      await notifService.notifyPostReply(post.userId, authorUsername, postId, post.roomId);
    }
  }
} catch (notifErr) {
  console.error('Comment notification failed:', notifErr);
}

  res.status(201).json(comment);
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const result = await commentRepo.deleteComment(commentId, userId);
  if (!result) return res.status(404).json({ message: 'Comment not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: 'Comment deleted successfully' });
};

const voteComment = async (req, res) => {
  const { commentId } = req.params;
  const { voteType } = req.body;
  const userId = req.user.id;

  const comment = await commentRepo.getCommentById(commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  const post = await postRepo.getPostById(comment.post_id);
  if (await isUserSuspendedInRoom(post.room_id, userId)) {
    return res.status(403).json({ message: 'You are suspended from voting in this room.' });
  }

  const result = await voteRepo.voteComment(commentId, userId, voteType);
  if (!result) return res.status(404).json({ message: 'Comment not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json(result);
};

const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const updated = await commentRepo.updateComment(commentId, userId, content);
  if (!updated) return res.status(404).json({ message: 'Comment not found' });
  if (updated.error) return res.status(403).json({ message: updated.error });

  res.json(updated);
};

const getCommentsByPost = async (req, res) => {
  const { postId } = req.params;
  const comments = await commentRepo.getCommentsByPost(postId);
  res.json(comments);
};

// --- user content ---

const getPostsByUser = async (req, res) => {
  const userId = req.params.userId;
  const posts = await postRepo.getPostsByUser(userId);
  res.json(posts);
};

const getCommentsByUser = async (req, res) => {
  const userId = req.params.userId;
  const comments = await commentRepo.getCommentsByUser(userId);
  res.json(comments);
};

// --- search ---

const searchPosts = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const result = await pool.query(
    `SELECT p.*,
      u.username as author_username,
      u.profile_pic_url as author_profile_pic
     FROM posts p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.content ILIKE $1 OR p.title ILIKE $1
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [`%${q}%`]
  );
 
  res.json(toCamel(result.rows));
};

// --- saved posts ---

const savePost = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  const post = await postRepo.getPostById(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const result = await userRepo.savePost(userId, postId);
  if (result.error) return res.status(400).json({ message: result.error });

  res.json({ message: 'Post saved' });
};

const unsavePost = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  const result = await userRepo.unsavePost(userId, postId);
  if (result.error) return res.status(400).json({ message: result.error });

  res.json({ message: 'Post unsaved' });
};

const getSavedPosts = async (req, res) => {
  const userId = req.user.id;
  const posts = await postRepo.getSavedPostsByUser(userId);
  res.json(posts);
};

// --- reports ---

const reportPost = async (req, res) => {
  const { postId } = req.params;
  const { reason, details } = req.body;
  const reportedBy = req.user.id;

  if (!reason) return res.status(400).json({ message: 'Report reason is required' });

  try {
    await pool.query(
      `INSERT INTO reports (reported_by, post_id, reason, details) VALUES ($1,$2,$3,$4)`,
      [reportedBy, postId, reason, details || null]
    );
    res.json({ message: 'Post reported successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Already reported' });
    throw err;
  }
};

const reportComment = async (req, res) => {
  const { commentId } = req.params;
  const { reason, details } = req.body;
  const reportedBy = req.user.id;

  if (!reason) return res.status(400).json({ message: 'Report reason is required' });

  try {
    await pool.query(
      `INSERT INTO reports (reported_by, comment_id, reason, details) VALUES ($1,$2,$3,$4)`,
      [reportedBy, commentId, reason, details || null]
    );
    res.json({ message: 'Comment reported successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Already reported' });
    throw err;
  }
};

module.exports = {
  createPost,
  getPostById,
  getPostsAll,
  votePost,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  voteComment,
  updateComment,
  getCommentsByPost,
  getPostsByUser,
  getCommentsByUser,
  searchPosts,
  savePost,
  unsavePost,
  getSavedPosts,
  reportPost,
  reportComment,
};