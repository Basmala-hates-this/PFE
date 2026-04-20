// const postRepo = require("../repositories/post.repo");
// const roomRepo = require("../repositories/room.repo");


// const isUserSuspendedInRoom = (roomId, userId) => {
//   const room = roomRepo.getRoomById(roomId);
//   if (!room) return false;
//   const suspension = room.suspendedMembers?.find(s => s.userId === userId);
//   if (!suspension) return false;
//   return new Date(suspension.until) > new Date();
// };

// const createPost = (req, res) => {
//   const { title, content, roomId, resourceLink, resourceLabel } = req.body;
//   const authorId = req.user.id;
//   const authorUsername = req.user.username;
//   const authorRole = req.user.role;

//   if (isUserSuspendedInRoom(roomId, authorId)) {
//   return res.status(403).json({ message: "You are suspended from posting in this room." });
// }

//   const image = req.file && req.file.mimetype.startsWith("image/")
//     ? `http://localhost:5000/uploads/${req.file.filename}`
//     : null;

//   const pdf = req.file && req.file.mimetype === "application/pdf"
//     ? `http://localhost:5000/uploads/${req.file.filename}`
//     : null;

//   const newPost = postRepo.createPost({
//     title,
//     content,
//     roomId,
//     authorId,
//     authorUsername,
//     authorRole,
//     image,
//     pdf,
//     resourceLink: resourceLink || null,
//     resourceLabel: resourceLabel || null,
//   });

//   res.status(201).json(newPost);
// };

// const getPostById = (req, res) => {
//   const { id } = req.params;
//   const post = postRepo.getPostById(id);
//   if (!post) {
//     return res.status(404).json({ message: "Post not found" });
//   }
//   res.json(post);
// };

// const getPostsAll = (req, res) => {
//   const { roomId } = req.query;
//   const posts = postRepo.getPostsAll(roomId);
//   res.json(posts);
// };

// const votePost = (req, res) => {
//   const { id } = req.params;
//   const { voteType } = req.body;
//     const userId = req.user.id;

    


//   const post = postRepo.votePost(id, userId, voteType);
//   if (!post) {
//     return res.status(404).json({ message: "Post not found" });
//   }
//   if (post.error) {//case of trying to vote on own post
//     return res.status(403).json({ message: post.error });
//   }
//   //suspended ahole
// if (isUserSuspendedInRoom(post.roomId, userId)) {
//   return res.status(403).json({ message: "You are suspended from voting in this room." });
// }
//   res.json(post);
// };


// const updatePost = (req, res) => {
//   const { id } = req.params;
//   const { title, content } = req.body;
//   const userId = req.user.id;
//     const updatedPost = postRepo.updatePost(id, userId, { title, content });
//     if (!updatedPost) {
//     return res.status(404).json({ message: "Post not found" });
//   }
//     if (updatedPost.error) {
//     return res.status(403).json({ message: updatedPost.error });
//   }
//   res.json(updatedPost);
// };

// const deletePost = (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;
//   const deletedPost = postRepo.deletePost(id, userId);
//   if (!deletedPost) {
//     return res.status(404).json({ message: "Post not found" });
//   }
//   if (deletedPost.error) {
//     return res.status(403).json({ message: deletedPost.error });
//   }
//   res.json({ message: "Post deleted successfully" });
// };

// const addComment = (req, res) => {
//   const { postId } = req.params;
//   const { content, parentCommentId, resourceLink, resourceLabel } = req.body;
//   const authorId = req.user.id;
//   const authorUsername = req.user.username;

//   const post = postRepo.getPostById(postId);
// if (!post) return res.status(404).json({ message: "Post not found" });

// if (isUserSuspendedInRoom(post.roomId, authorId)) {
//   return res.status(403).json({ message: "You are suspended from commenting in this room." });
// }

//   const image = req.file && req.file.mimetype.startsWith("image/")
//     ? `http://localhost:5000/uploads/${req.file.filename}`
//     : null;

//   const pdf = req.file && req.file.mimetype === "application/pdf"
//     ? `http://localhost:5000/uploads/${req.file.filename}`
//     : null;

//   const comment = postRepo.addComment(postId, {
//     authorId,
//     authorUsername,
//     content,
//     parentCommentId,
//     image,
//     pdf,
//     resourceLink: resourceLink || null,
//     resourceLabel: resourceLabel || null,
//   });

//   if (!comment) {
//     return res.status(404).json({ message: "Post not found" });
//   }

//   res.status(201).json(comment);
// };

// const deleteComment = (req, res) => {
//   const { postId, commentId } = req.params;
//   const userId = req.user.id;

//   const deletedComment = postRepo.deleteComment(commentId, postId, userId);
//   if (!deletedComment) {
//     return res.status(404).json({ message: "Comment not found" });
//   }
//   if (deletedComment.error) {
//     return res.status(403).json({ message: deletedComment.error });
//   }
//   res.json({ message: "Comment deleted successfully" });
// };

// const voteComment = (req, res) => {
//   const { postId, commentId } = req.params;
//   const { voteType } = req.body;
//   const userId = req.user.id;

//   const post = postRepo.voteComment(postId, userId, voteType, commentId);
//   if (!post) {
//     return res.status(404).json({ message: "Post not found" });
//   }
//   if (post.error) {
//     return res.status(403).json({ message: post.error });
//   }

// if (isUserSuspendedInRoom(post.roomId, userId)) {
//   return res.status(403).json({ message: "You are suspended from voting in this room." });
// }

//   res.json(post);
// };


// const getPostsByUser = (req, res) => {
//   const userId = req.params.userId;
//   const posts = postRepo.getPostsByUser(userId);
//   res.json(posts);
// };

// const getCommentsByUser = (req, res) => {
//   const userId = req.params.userId;
//   const comments = postRepo.getCommentsByUser(userId);
//   res.json(comments);
// };

// // const getMyStats = (req, res) => {
// //   const userId = req.user.id;
  
// //   const posts = postRepo.getPostsByUser(userId);
// //   const comments = postRepo.getCommentsByUser(userId);

// //   // calculate vote totals from posts
// //   const usefulVotes = posts.reduce((total, post) => total + post.votes.useful, 0);
// //   const uselessVotes = posts.reduce((total, post) => total + post.votes.useless, 0);

// //   // calculate vote totals from comments
// //   const commentUseful = comments.reduce((total, c) => total + c.votes.useful, 0);
// //   const commentSpecialized = comments.reduce((total, c) => total + c.votes.specialized, 0);

// //   res.json({
// //     postsCount: posts.length,
// //     commentsCount: comments.length,
// //     usefulReceived: usefulVotes + commentUseful,
// //     uselessReceived: uselessVotes,
// //     specializedReceived: commentSpecialized,
// //   });
// // };

// const updateComment = (req, res) => {
//   const { postId, commentId } = req.params;
//   const { content } = req.body;
//   const userId = req.user.id;

//   const updatedComment = postRepo.updateComment(postId, commentId, userId, content);
  
//   if (!updatedComment) {
//     return res.status(404).json({ message: "Comment not found" });
//   }
//   if (updatedComment.error) {
//     return res.status(403).json({ message: updatedComment.error });
//   }
//   res.json(updatedComment);
// };

// //search starter pack
// const searchPosts = (req, res) => {
//   const { q } = req.query;
//   if (!q) return res.json([]);
  
//   const posts = postRepo.getPostsAll();
//   const results = posts.filter(p => 
//     p.title?.toLowerCase().includes(q.toLowerCase()) ||
//     p.content?.toLowerCase().includes(q.toLowerCase())
//   ); // limit to 5 results
  
//   res.json(results);
// };


// const savePost = (req, res) => {
//   const userId = req.user.id;
//   const { postId } = req.params;
//   const userRepo = require("../repositories/user.repo");

//   const post = postRepo.getPostById(postId);
//   if (!post) return res.status(404).json({ message: "Post not found" });

//   const result = userRepo.savePost(userId, postId);
//   if (result.error) return res.status(400).json({ message: result.error });

//   res.json({ message: "Post saved" });
// };

// const unsavePost = (req, res) => {
//   const userId = req.user.id;
//   const { postId } = req.params;
//   const userRepo = require("../repositories/user.repo");

//   const result = userRepo.unsavePost(userId, postId);
//   if (result.error) return res.status(400).json({ message: result.error });

//   res.json({ message: "Post unsaved" });
// };

// const getSavedPosts = (req, res) => {
//   const userId = req.user.id;
//   const userRepo = require("../repositories/user.repo");

//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const savedPosts = (user.savedPosts || [])
//     .map(postId => postRepo.getPostById(postId))
//     .filter(Boolean);

//   res.json(savedPosts);
// };



// const reportPost = (req, res) => {
//   const { postId } = req.params;
//   const { reason, details } = req.body;
//   const reportedBy = req.user.id;

//   if (!reason) return res.status(400).json({ message: "Report reason is required" });

//   const result = postRepo.reportPost(postId, { reportedBy, reason, details });
//   if (result?.error) return res.status(400).json({ message: result.error });

//   res.json({ message: "Post reported successfully" });
// };

// const reportComment = (req, res) => {
//   const { postId, commentId } = req.params;
//   const { reason, details } = req.body;
//   const reportedBy = req.user.id;

//   if (!reason) return res.status(400).json({ message: "Report reason is required" });

//   const result = postRepo.reportComment(postId, commentId, { reportedBy, reason, details });
//   if (result?.error) return res.status(400).json({ message: result.error });

//   res.json({ message: "Comment reported successfully" });
// };

// module.exports = {
//   createPost,
//   getPostById,
//   getPostsAll,
//   votePost,
//   updatePost,
//   deletePost,
//   addComment,
//   deleteComment,
//   voteComment,
//   getPostsByUser,
//   getCommentsByUser,
//   // getMyStats,
//   updateComment,
//   searchPosts,
//   savePost,
//   unsavePost,
//   getSavedPosts,
//   reportPost,
//   reportComment,
// };


const postRepo = require('../repositories/post.repo');
const commentRepo = require('../repositories/comment.repo');
const voteRepo = require('../repositories/vote.repo');
const roomRepo = require('../repositories/room.repo');
const userRepo = require('../repositories/user.repo');
const pool = require('../db');
const toCamel = require('../utils/toCamel');

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

  const image = req.file && req.file.mimetype.startsWith('image/')
    ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  const pdf = req.file && req.file.mimetype === 'application/pdf'
    ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  const newPost = await postRepo.createPost({
    title, content, roomId,
    authorId, authorUsername, authorRole,
    image, pdf,
    resourceLink: resourceLink || null,
    resourceLabel: resourceLabel || null,
  });

  res.status(201).json(newPost);
};

const getPostById = async (req, res) => {
  const { id } = req.params;
  const post = await postRepo.getPostById(id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
};

const getPostsAll = async (req, res) => {
  const { roomId, sort } = req.query;

  let posts;
  if (roomId) {
    if (sort === 'top') {
      const result = await pool.query(
        `SELECT p.*,
  COALESCE(v.useful, 0) as vote_useful,
  COALESCE(v.useless, 0) as vote_useless,
  COUNT(DISTINCT c.id) as comment_count,
  u.profile_pic_url as author_profile_pic
 FROM posts p
 LEFT JOIN post_vote_counts v ON v.post_id = p.id
 LEFT JOIN comments c ON c.post_id = p.id
 LEFT JOIN users u ON u.id = p.user_id
 WHERE p.room_id = $1
 GROUP BY p.id, v.useful, v.useless, u.profile_pic_url
 ORDER BY vote_useful DESC`,
        [roomId]
      );
      posts = toCamel(result.rows);
    } else {
      posts = await postRepo.getPostsByRoom(roomId);
    }
  } else {
    const result = await pool.query(
  `SELECT p.*,
    COALESCE(v.useful, 0) as vote_useful,
    COALESCE(v.useless, 0) as vote_useless,
    COUNT(DISTINCT c.id) as comment_count,
    u.profile_pic_url as author_profile_pic
   FROM posts p
   LEFT JOIN post_vote_counts v ON v.post_id = p.id
   LEFT JOIN comments c ON c.post_id = p.id
   LEFT JOIN users u ON u.id = p.user_id
   GROUP BY p.id, v.useful, v.useless, u.profile_pic_url
   ORDER BY p.created_at DESC`
);
    posts = toCamel(result.rows);
  }

  res.json(posts);
};

const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  const updatedPost = await postRepo.updatePost(id, userId, { title, content });
  if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
  if (updatedPost.error) return res.status(403).json({ message: updatedPost.error });

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

  const image = req.file && req.file.mimetype.startsWith('image/')
    ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  const pdf = req.file && req.file.mimetype === 'application/pdf'
    ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  const comment = await commentRepo.createComment({
    postId,
    authorId,
    authorUsername,
    content,
    parentCommentId: parentCommentId || null,
    image, pdf,
    resourceLink: resourceLink || null,
    resourceLabel: resourceLabel || null,
  });

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
    `SELECT * FROM posts
     WHERE content ILIKE $1 OR title ILIKE $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [`%${q}%`]
  );

  res.json(result.rows);
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