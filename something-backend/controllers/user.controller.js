const postRepo = require("../repositories/post.repo");
const userRepo = require("../repositories/user.repo");



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

const getMyStats = (req, res) => {
  const userId = req.user.id;
  
  const posts = postRepo.getPostsByUser(userId);
  const comments = postRepo.getCommentsByUser(userId);

  // calculate vote totals from posts
  const usefulVotes = posts.reduce((total, post) => total + post.votes.useful, 0);
  const uselessVotes = posts.reduce((total, post) => total + post.votes.useless, 0);

  // calculate vote totals from comments
  const commentUseful = comments.reduce((total, c) => total + c.votes.useful, 0);
  const commentSpecialized = comments.reduce((total, c) => total + c.votes.specialized, 0);

  res.json({
    postsCount: posts.length,
    commentsCount: comments.length,
    usefulReceived: usefulVotes + commentUseful,
    uselessReceived: uselessVotes,
    specializedReceived: commentSpecialized,
  });
};




//the amount of stupid namings because i cant think right at night.....
//ta-ra tat ta-ra tat taa-tat


const updateMe = async (req, res) => {
   const userId = req.user.id;
  const username = req.body?.username;
  const email = req.body?.email;
  // const userId = req.user.id;
  // const { username, email } = req.body;

  const currentUser = userRepo.findById(userId);
  if (!currentUser) return res.status(404).json({ message: "User not found" });

  if (username && username !== currentUser.username) {
    const existing = userRepo.findByUsername(username);
    if (existing) return res.status(400).json({ message: "Username already taken" });
  }

  if (email && email !== currentUser.email) {
    const existing = userRepo.findByEmail(email);
    if (existing) return res.status(400).json({ message: "Email already exists" });
  }

  // if a file was uploaded, use its path
  const profilePic = req.file 
    ? `http://localhost:5000/uploads/${req.file.filename}`
    : currentUser.profilePic;

  const updatedUser = userRepo.updateUser(userId, {
    username: username || currentUser.username,
    email: email || currentUser.email,
    profilePic
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
};



//le me ....memememememememememememememeemmemememememememememe
const getMe = (req, res) => {
  const userId = req.user.id;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};



const deleteMe = async (req, res) => {
  const userId = req.user.id;
  const user = userRepo.findById(userId);
  
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.deleteUser(userId);
  res.json({ message: "Account deleted successfully" });
};


//search starter pack...but for users instead...
const searchUsers = (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  
  const users = userRepo.readUsers();
  const results = users
    .filter(u => u.username?.toLowerCase().includes(q.toLowerCase()))
    .map(({ password, ...u }) => u)
    .slice(0, 2);
  
  res.json(results);
};


const getUserById = (req, res) => {
  const { userId } = req.params;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};


const getStatsByUserId = (req, res) => {
  const { userId } = req.params;
  
  const posts = postRepo.getPostsByUser(userId);
  const comments = postRepo.getCommentsByUser(userId);

  const usefulVotes = posts.reduce((total, post) => total + post.votes.useful, 0);
  const uselessVotes = posts.reduce((total, post) => total + post.votes.useless, 0);
  const commentUseful = comments.reduce((total, c) => total + c.votes.useful, 0);
  const commentSpecialized = comments.reduce((total, c) => total + c.votes.specialized, 0);

  res.json({
    postsCount: posts.length,
    commentsCount: comments.length,
    usefulReceived: usefulVotes + commentUseful,
    uselessReceived: uselessVotes,
    specializedReceived: commentSpecialized,
  });
};

module.exports = {
  getMyStats,
  getPostsByUser,
  getCommentsByUser,
  updateMe,
  getMe,
  deleteMe,
  searchUsers,
  getUserById,
  getStatsByUserId

  
};