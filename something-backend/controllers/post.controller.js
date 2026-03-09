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


module.exports = {
  createPost,
  getPostById,
  getPostsAll,
  votePost,
};