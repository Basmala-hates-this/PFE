const postRepo = require("../repositories/post.repo");

const createPost = (req, res) => {
  const { title, content, roomId } = req.body;
  const authorId = req.user.id;
  const authorUsername = req.user.username;
   const authorRole = req.user.role;

  const newPost = postRepo.createPost({
    title,
    content,
    roomId,
    authorId,
    authorUsername,
    authorRole,
  });

  res.status(201).json(newPost);
};

const getPostById = (req, res) => {
  const { id } = req.params;
  const post = postRepo.getPostById(id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  res.json(post);
};

const getPostsAll = (req, res) => {
  const { roomId } = req.query;
  const posts = postRepo.getPostsAll(roomId);
  res.json(posts);
};

const votePost = (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body;
    const userId = req.user.id;

  const post = postRepo.votePost(id, userId, voteType);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (post.error) {//case of trying to vote on own post
    return res.status(403).json({ message: post.error });
  }
  res.json(post);
};

const updatePost = (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;
    const updatedPost = postRepo.updatePost(id, userId, { title, content });
    if (!updatedPost) {
    return res.status(404).json({ message: "Post not found" });
  }
    if (updatedPost.error) {
    return res.status(403).json({ message: updatedPost.error });
  }
  res.json(updatedPost);
};

const deletePost = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const deletedPost = postRepo.deletePost(id, userId);
  if (!deletedPost) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (deletedPost.error) {
    return res.status(403).json({ message: deletedPost.error });
  }
  res.json({ message: "Post deleted successfully" });
};

const addComment = (req, res) => {
  const { postId } = req.params;
  const { content, parentCommentId } = req.body;
  const authorId = req.user.id;
  const authorUsername = req.user.username;

  const comment = postRepo.addComment(postId, {
    authorId,
    authorUsername,
    content,
    parentCommentId
  });

  if (!comment) {
    return res.status(404).json({ message: "Post not found" });
  }

  res.status(201).json(comment);
};

const deleteComment = (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  const deletedComment = postRepo.deleteComment(commentId, postId, userId);
  if (!deletedComment) {
    return res.status(404).json({ message: "Comment not found" });
  }
  if (deletedComment.error) {
    return res.status(403).json({ message: deletedComment.error });
  }
  res.json({ message: "Comment deleted successfully" });
};

const voteComment = (req, res) => {
  const { postId, commentId } = req.params;
  const { voteType } = req.body;
  const userId = req.user.id;

  const post = postRepo.voteComment(postId, userId, voteType, commentId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  if (post.error) {
    return res.status(403).json({ message: post.error });
  }
  res.json(post);
};


const getPostsByUser = (req, res) => {
  const userId = req.params.userId;
  const posts = postRepo.getPostsByUser(userId);
  res.json(posts);
};

const getCommentsByUser = (req, res) => {
  const userId = req.params.userId;
  const comments = postRepo.getCommentsByUser(userId);
  res.json(comments);
};

// const getMyStats = (req, res) => {
//   const userId = req.user.id;
  
//   const posts = postRepo.getPostsByUser(userId);
//   const comments = postRepo.getCommentsByUser(userId);

//   // calculate vote totals from posts
//   const usefulVotes = posts.reduce((total, post) => total + post.votes.useful, 0);
//   const uselessVotes = posts.reduce((total, post) => total + post.votes.useless, 0);

//   // calculate vote totals from comments
//   const commentUseful = comments.reduce((total, c) => total + c.votes.useful, 0);
//   const commentSpecialized = comments.reduce((total, c) => total + c.votes.specialized, 0);

//   res.json({
//     postsCount: posts.length,
//     commentsCount: comments.length,
//     usefulReceived: usefulVotes + commentUseful,
//     uselessReceived: uselessVotes,
//     specializedReceived: commentSpecialized,
//   });
// };

const updateComment = (req, res) => {
  const { postId, commentId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const updatedComment = postRepo.updateComment(postId, commentId, userId, content);
  
  if (!updatedComment) {
    return res.status(404).json({ message: "Comment not found" });
  }
  if (updatedComment.error) {
    return res.status(403).json({ message: updatedComment.error });
  }
  res.json(updatedComment);
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
  getPostsByUser,
  getCommentsByUser,
  // getMyStats,
  updateComment,
};