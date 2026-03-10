const postRepo = require("../repositories/post.repo");

const createPost = (req, res) => {
  const { title, content, roomId } = req.body;
  const authorId = req.user.id;
  const authorUsername = req.user.username;

  const newPost = postRepo.createPost({
    title,
    content,
    roomId,
    authorId,
    authorUsername
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
  const posts = postRepo.getPostsAll();
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
};