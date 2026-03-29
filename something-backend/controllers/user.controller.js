const postRepo = require("../repositories/post.repo");
const userRepo = require("../repositories/user.repo");
const roomRepo = require("../repositories/room.repo");



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
    .filter(u => u.id !== req.user.id)
    .map(({ password, ...u }) => u);
    //maybe add slice and limit the ammount in frint end...or keep backend clean and mess with frontend only
  
  res.json(results);
};


const getUserById = (req, res) => {
  const { userId } = req.params;
  const user = userRepo.findById(userId);
//console.log("getUserById followers:", user?.followers);
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




const followUser = async (req, res) => {
  const followerId = req.user.id;
  const { userId: targetId } = req.params;

  const result = userRepo.followUser(followerId, targetId);
  //console.log("follow result:", result);
  if (result.error) return res.status(400).json({ message: result.error });

  // send email notification to the followed user
  try {
    const target = userRepo.findById(targetId);
    const follower = userRepo.findById(followerId);
    const { sendFollowEmail } = require("../config/email");
    await sendFollowEmail(target.email, follower.username);
  } catch (err) {
    console.error("Failed to send follow email:", err);
  }

  res.json({ message: "Followed successfully" });
};

const unfollowUser = (req, res) => {
  const followerId = req.user.id;
  const { userId: targetId } = req.params;

  const result = userRepo.unfollowUser(followerId, targetId);
  if (result.error) return res.status(400).json({ message: result.error });

  res.json({ message: "Unfollowed successfully" });
};

const getFollowers = (req, res) => {
  const { userId } = req.params;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const followers = (user.followers || []).map(id => {
    const u = userRepo.findById(id);
    if (!u) return null;
    const { password: _, ...rest } = u;
    return rest;
  }).filter(Boolean);

  res.json(followers);
};

const getFollowing = (req, res) => {
  const { userId } = req.params;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const following = (user.following || []).map(id => {
    const u = userRepo.findById(id);
    if (!u) return null;
    const { password: _, ...rest } = u;
    return rest;
  }).filter(Boolean);

  res.json(following);
};


const reportUser = (req, res) => {
  const { userId } = req.params;
  const { reason, details } = req.body;
  const reportedBy = req.user.id;

  if (!reason) return res.status(400).json({ message: "Report reason is required" });
  if (reportedBy === userId) return res.status(400).json({ message: "Cannot report yourself" });

  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const alreadyReported = (user.userReports || []).some(r => r.reportedBy === reportedBy);
  if (alreadyReported) return res.status(400).json({ message: "Already reported this user" });

  userRepo.updateUser(userId, {
    userReports: [...(user.userReports || []), {
      reportedBy,
      reason,
      details: details || "",
      createdAt: new Date().toISOString()
    }]
  });

  res.json({ message: "User reported successfully" });
};

//prof accepted-?then prof...
//prof rejected->then become student and reorient to one major and remove the rest
const selectMajorAfterRejection = async (req, res) => {
  const userId = req.user.id;
  const { selectedMajor } = req.body;

  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!user.pendingReorientation) return res.status(400).json({ message: "No reorientation pending" });
  if (!user.majors?.includes(selectedMajor)) return res.status(400).json({ message: "Invalid major selection" });

  // get all rooms and find ones to leave
  const allRooms = roomRepo.getAllRooms();
  const roomsToLeave = allRooms.filter(room => {
    if (!room.members.includes(userId)) return false;
    if (room.type === "major" && room.major !== selectedMajor) return true;
    if (room.type === "subject" && room.major !== selectedMajor) return true;
    return false;
  });

  // remove user from those rooms
  const updatedRooms = allRooms.map(room => {
    if (roomsToLeave.find(r => r.id === room.id)) {
      return { ...room, members: room.members.filter(id => id !== userId) };
    }
    return room;
  });
  roomRepo.writeRooms(updatedRooms);

  // update user
  const remainingRoomIds = (user.rooms || []).filter(
    roomId => !roomsToLeave.find(r => r.id === roomId)
  );

  userRepo.updateUser(userId, {
    majors: [selectedMajor],
    pendingReorientation: false,
    rooms: remainingRoomIds,
    actionHistory: [...(user.actionHistory || []), {
      action: "major_selected_after_rejection",
      major: selectedMajor,
      date: new Date().toISOString()
    }]
  });

  res.json({ message: "Major selected successfully", major: selectedMajor });
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
  getStatsByUserId,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  reportUser,
  selectMajorAfterRejection,


  
};