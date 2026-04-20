// const postRepo = require("../repositories/post.repo");
// const userRepo = require("../repositories/user.repo");
// const roomRepo = require("../repositories/room.repo");



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

// const getMyComments = (req, res) => {
//   const comments = postRepo.getCommentsByUser(req.user.id);
//   res.json(comments);
// };


// //the amount of stupid namings because i cant think right at night.....
// //ta-ra tat ta-ra tat taa-tat


// const updateMe = async (req, res) => {
//    const userId = req.user.id;
//   const username = req.body?.username;
//   const email = req.body?.email;
//   // const userId = req.user.id;
//   // const { username, email } = req.body;

//   const currentUser = userRepo.findById(userId);
//   if (!currentUser) return res.status(404).json({ message: "User not found" });

//   if (username && username !== currentUser.username) {
//     const existing = userRepo.findByUsername(username);
//     if (existing) return res.status(400).json({ message: "Username already taken" });
//   }

//   if (email && email !== currentUser.email) {
//     const existing = userRepo.findByEmail(email);
//     if (existing) return res.status(400).json({ message: "Email already exists" });
//   }

//   // if a file was uploaded, use its path
//   const profilePic = req.file 
//     ? `http://localhost:5000/uploads/${req.file.filename}`
//     : currentUser.profilePic;

//   const updatedUser = userRepo.updateUser(userId, {
//     username: username || currentUser.username,
//     email: email || currentUser.email,
//     profilePic
//   });

//   const { password: _, ...userWithoutPassword } = updatedUser;
//   res.json(userWithoutPassword);
// };



// //le me ....memememememememememememememeemmemememememememememe
// const getMe = (req, res) => {
//   const userId = req.user.id;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });
  
//   const { password: _, ...userWithoutPassword } = user;
//   res.json(userWithoutPassword);
// };



// const deleteMe = async (req, res) => {
//   const userId = req.user.id;
//   const user = userRepo.findById(userId);
  
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.deleteUser(userId);
//   res.json({ message: "Account deleted successfully" });
// };


// //search starter pack...but for users instead...
// const searchUsers = (req, res) => {
//   const { q } = req.query;
//   if (!q) return res.json([]);
  
//   const users = userRepo.readUsers();
//   const results = users
//     .filter(u => u.username?.toLowerCase().includes(q.toLowerCase()))
//     .filter(u => u.id !== req.user.id)
//     .map(({ password, ...u }) => u);
//     //maybe add slice and limit the ammount in frint end...or keep backend clean and mess with frontend only
  
//   res.json(results);
// };


// const getUserById = (req, res) => {
//   const { userId } = req.params;
//   const user = userRepo.findById(userId);
// //console.log("getUserById followers:", user?.followers);
//   if (!user) return res.status(404).json({ message: "User not found" });
  
//   const { password: _, ...userWithoutPassword } = user;
//   res.json(userWithoutPassword);
// };


// const getStatsByUserId = (req, res) => {
//   const { userId } = req.params;
  
//   const posts = postRepo.getPostsByUser(userId);
//   const comments = postRepo.getCommentsByUser(userId);

//   const usefulVotes = posts.reduce((total, post) => total + post.votes.useful, 0);
//   const uselessVotes = posts.reduce((total, post) => total + post.votes.useless, 0);
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




// const followUser = async (req, res) => {
//   const followerId = req.user.id;
//   const { userId: targetId } = req.params;

//   const result = userRepo.followUser(followerId, targetId);
//   //console.log("follow result:", result);
//   if (result.error) return res.status(400).json({ message: result.error });

//   // send email notification to the followed user
//   try {
//     const target = userRepo.findById(targetId);
//     const follower = userRepo.findById(followerId);
//     const { sendFollowEmail } = require("../config/email");
//     await sendFollowEmail(target.email, follower.username);
//   } catch (err) {
//     console.error("Failed to send follow email:", err);
//   }

//   res.json({ message: "Followed successfully" });
// };

// const unfollowUser = (req, res) => {
//   const followerId = req.user.id;
//   const { userId: targetId } = req.params;

//   const result = userRepo.unfollowUser(followerId, targetId);
//   if (result.error) return res.status(400).json({ message: result.error });

//   res.json({ message: "Unfollowed successfully" });
// };

// const getFollowers = (req, res) => {
//   const { userId } = req.params;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const followers = (user.followers || []).map(id => {
//     const u = userRepo.findById(id);
//     if (!u) return null;
//     const { password: _, ...rest } = u;
//     return rest;
//   }).filter(Boolean);

//   res.json(followers);
// };

// const getFollowing = (req, res) => {
//   const { userId } = req.params;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const following = (user.following || []).map(id => {
//     const u = userRepo.findById(id);
//     if (!u) return null;
//     const { password: _, ...rest } = u;
//     return rest;
//   }).filter(Boolean);

//   res.json(following);
// };


// const reportUser = (req, res) => {
//   const { userId } = req.params;
//   const { reason, details } = req.body;
//   const reportedBy = req.user.id;

//   if (!reason) return res.status(400).json({ message: "Report reason is required" });
//   if (reportedBy === userId) return res.status(400).json({ message: "Cannot report yourself" });

//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const alreadyReported = (user.userReports || []).some(r => r.reportedBy === reportedBy);
//   if (alreadyReported) return res.status(400).json({ message: "Already reported this user" });

//   userRepo.updateUser(userId, {
//     userReports: [...(user.userReports || []), {
//       reportedBy,
//       reason,
//       details: details || "",
//       createdAt: new Date().toISOString()
//     }]
//   });

//   res.json({ message: "User reported successfully" });
// };

// //prof accepted-?then prof...
// //prof rejected->then become student and reorient to one major and remove the rest
// const selectMajorAfterRejection = async (req, res) => {
//   const userId = req.user.id;
//   const { selectedMajor } = req.body;

//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });
//   if (!user.pendingReorientation) return res.status(400).json({ message: "No reorientation pending" });
//   if (!user.majors?.includes(selectedMajor)) return res.status(400).json({ message: "Invalid major selection" });

//   // get all rooms and find ones to leave
//   const allRooms = roomRepo.getAllRooms();
//   const roomsToLeave = allRooms.filter(room => {
//     if (!room.members.includes(userId)) return false;
//     if (room.type === "major" && room.major !== selectedMajor) return true;
//     if (room.type === "subject" && room.major !== selectedMajor) return true;
//     return false;
//   });

//   // remove user from those rooms
//   const updatedRooms = allRooms.map(room => {
//     if (roomsToLeave.find(r => r.id === room.id)) {
//       return { ...room, members: room.members.filter(id => id !== userId) };
//     }
//     return room;
//   });
//   roomRepo.writeRooms(updatedRooms);

//   // update user
//   const remainingRoomIds = (user.rooms || []).filter(
//     roomId => !roomsToLeave.find(r => r.id === roomId)
//   );

//   userRepo.updateUser(userId, {
//     majors: [selectedMajor],
//     pendingReorientation: false,
//     rooms: remainingRoomIds,
//     actionHistory: [...(user.actionHistory || []), {
//       action: "major_selected_after_rejection",
//       major: selectedMajor,
//       date: new Date().toISOString()
//     }]
//   });

//   res.json({ message: "Major selected successfully", major: selectedMajor });
// };


// const selectValidInputs = async (req, res) => {
//   const userId = req.user.id;
//   const { selectedUniversity, selectedMajors } = req.body;

//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });
//   if (user.otherInputStatus !== "rejected") return res.status(400).json({ message: "No input correction needed" });

//   const DEFAULT_UNI_CODES = [
//     "UA1","UA2","UA3","USTHB","ENP","ESNA","NHV","BMU",
//     "UB1","UB2","UBj","UBs","UBl1","Ubl2","UCh",
//     "UC1","UC2","UC3","UD","UG","UJ","UL","UM","UMs",
//     "UO1","UO2","USTO","UOr","USa","USBA","USk","USA",
//     "US1","US2","UTi","UTl","UTO"
//   ];

//   const DEFAULT_MAJORS = [
//     "Computer Science","Mathematics","Physics","Chemistry","Biology",
//     "Civil Engineering","Mechanical Engineering","Electrical Engineering",
//     "Process Engineering","Architecture","Natural and Life Science","Agronomy",
//     "Renewable Energies","Geology","Medicine","Pharmacy","Dental Medicine",
//     "Veterinary Medicine","Law","Political Science & International Relations",
//     "Economics & Commerce & Management Science","History","Psychology",
//     "Sociology","Philosophy","Literature & Languages",
//     "Information & Communucation Science","Sport Science & Physical Education",
//     "Art & Design"
//   ];

//   const updates = {};
//   const hasCustomUni = user.university?.code && !DEFAULT_UNI_CODES.includes(user.university.code);
//   const hasCustomMajors = user.majors?.some(m => !DEFAULT_MAJORS.includes(m));

//   // validate and apply university
//   if (hasCustomUni) {
//     if (!selectedUniversity) return res.status(400).json({ message: "Please select a valid university" });
//     if (!DEFAULT_UNI_CODES.includes(selectedUniversity.code)) {
//       return res.status(400).json({ message: "Invalid university selection" });
//     }
//     updates.university = selectedUniversity;

//     // update university room membership
//     const allRooms = roomRepo.getAllRooms();
    
//     // leave old university room
//     const oldUniRoom = allRooms.find(r => r.type === "university" && r.university === user.university.code);
//     // join or create new university room
//     let newUniRoom = allRooms.find(r => r.type === "university" && r.university === selectedUniversity.code);
    
//     if (!newUniRoom) {
//       newUniRoom = roomRepo.createRoom({
//         name: selectedUniversity.name,
//         type: "university",
//         university: selectedUniversity.code
//       });
//     }

//     const updatedRooms = roomRepo.getAllRooms().map(room => {
//       if (oldUniRoom && room.id === oldUniRoom.id) {
//         return { ...room, members: room.members.filter(id => id !== userId) };
//       }
//       return room;
//     });
//     roomRepo.writeRooms(updatedRooms);
//     roomRepo.addMember(newUniRoom.id, userId);

//     // update user rooms list
//     const newRoomsList = (user.rooms || [])
//       .filter(id => id !== oldUniRoom?.id)
//       .concat(newUniRoom.id);
//     updates.rooms = [...new Set(newRoomsList)];
//   }

//   // validate and apply majors
//   if (hasCustomMajors) {
//     if (!selectedMajors?.length) return res.status(400).json({ message: "Please select valid majors" });
//     const allValid = selectedMajors.every(m => DEFAULT_MAJORS.includes(m));
//     if (!allValid) return res.status(400).json({ message: "Invalid major selection" });

//     // find old custom major rooms to leave
//     const allRooms = roomRepo.getAllRooms();
//     const customMajors = user.majors.filter(m => !DEFAULT_MAJORS.includes(m));
    
//     const roomsToLeave = allRooms.filter(room =>
//       room.members.includes(userId) &&
//       (room.type === "major" || room.type === "subject") &&
//       customMajors.includes(room.major)
//     );

//     if (roomsToLeave.length > 0) {
//       const updatedRooms = roomRepo.getAllRooms().map(room => {
//         if (roomsToLeave.find(r => r.id === room.id)) {
//           return { ...room, members: room.members.filter(id => id !== userId) };
//         }
//         return room;
//       });
//       roomRepo.writeRooms(updatedRooms);
//     }

//     // join new major rooms
//     for (const major of selectedMajors) {
//       let majorRoom = allRooms.find(r => r.type === "major" && r.major === major);
//       if (!majorRoom) {
//         majorRoom = roomRepo.createRoom({ name: major, type: "major", major });
//       }
//       roomRepo.addMember(majorRoom.id, userId);
//     }

//     // keep valid existing majors + add new selections
//     const validExisting = user.majors.filter(m => DEFAULT_MAJORS.includes(m));
//     updates.majors = [...new Set([...validExisting, ...selectedMajors])];

//     // update rooms list
//     const currentRooms = updates.rooms || user.rooms || [];
//     const leftRoomIds = roomsToLeave.map(r => r.id);
//     const newMajorRoomIds = selectedMajors.map(major => {
//       const r = roomRepo.getAllRooms().find(r => r.type === "major" && r.major === major);
//       return r?.id;
//     }).filter(Boolean);

//     updates.rooms = [...new Set(
//       currentRooms.filter(id => !leftRoomIds.includes(id)).concat(newMajorRoomIds)
//     )];
//   }

//   updates.otherInputStatus = "corrected";
//   updates.actionHistory = [...(user.actionHistory || []), {
//     action: "valid_inputs_selected",
//     date: new Date().toISOString()
//   }];

//   userRepo.updateUser(userId, updates);
//   res.json({ message: "Inputs updated successfully" });
// };

// const getMyReceivedVotes = (req, res) => {
//   const userId = req.user.id;
//   const { type } = req.query; // "useful", "useless", "specialized"

//   const posts = postRepo.getPostsByUser(userId);
//   const comments = postRepo.getCommentsByUser(userId);

//   let results = [];

//   if (type === "useful") {
//     const votedPosts = posts
//       .filter(p => p.votes.useful > 0)
//       .map(p => ({ ...p, sourceType: "post" }));
//     const votedComments = comments
//       .filter(c => c.votes.useful > 0)
//       .map(c => ({ ...c, sourceType: "comment" }));
//     results = [...votedPosts, ...votedComments];

//   } else if (type === "useless") {
//     results = posts
//       .filter(p => p.votes.useless > 0)
//       .map(p => ({ ...p, sourceType: "post" }));

//   } else if (type === "specialized") {
//     results = comments
//       .filter(c => c.votes.specialized > 0)
//       .map(c => ({ ...c, sourceType: "comment" }));
//   }

//   res.json(results);
// };



// module.exports = {
//   getMyStats,
//   getPostsByUser,
//   getCommentsByUser,
//   updateMe,
//   getMe,
//   deleteMe,
//   searchUsers,
//   getUserById,
//   getStatsByUserId,
//   getFollowers,
//   getFollowing,
//   followUser,
//   unfollowUser,
//   reportUser,
//   selectMajorAfterRejection,
//   selectValidInputs,
//   getMyReceivedVotes,
//   getMyComments,


// };


const postRepo = require('../repositories/post.repo');
const commentRepo = require('../repositories/comment.repo');
const userRepo = require('../repositories/user.repo');
const roomRepo = require('../repositories/room.repo');
const pool = require('../db');
const { sendFollowEmail } = require('../config/email');

const getMe = async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password_hash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};

const updateMe = async (req, res) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  const currentUser = await userRepo.findById(userId);
  if (!currentUser) return res.status(404).json({ message: 'User not found' });

  if (username && username !== currentUser.username) {
    const existing = await userRepo.findByUsername(username);
    if (existing) return res.status(400).json({ message: 'Username already taken' });
  }

  if (email && email !== currentUser.email) {
    const existing = await userRepo.findByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email already exists' });
  }

  const profilePicUrl = req.file
    ? `http://localhost:5000/uploads/${req.file.filename}`
    : currentUser.profile_pic_url;

  const updatedUser = await userRepo.updateUser(userId, {
    username: username || currentUser.username,
    email: email || currentUser.email,
    profilePicUrl,
  });

  const { password_hash, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
};

const deleteMe = async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.deleteUser(req.user.id);
  res.json({ message: 'Account deleted successfully' });
};

const getUserById = async (req, res) => {
  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password_hash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};

const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const result = await pool.query(
    `SELECT id, username, email, role, authority_level, rating, profile_pic_url
     FROM users
     WHERE username ILIKE $1 AND id != $2
     LIMIT 20`,
    [`%${q}%`, req.user.id]
  );
  res.json(result.rows);
};

// --- stats ---

const getMyStats = async (req, res) => {
  const userId = req.user.id;
  await getStatsForUser(userId, res);
};

const getStatsByUserId = async (req, res) => {
  await getStatsForUser(req.params.userId, res);
};

const getStatsForUser = async (userId, res) => {
  const [posts, comments, votes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM posts WHERE user_id = $1`, [userId]),
    pool.query(`SELECT COUNT(*) FROM comments WHERE user_id = $1`, [userId]),
    pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE v.type = 'useful'      AND (p.user_id = $1 OR c.user_id = $1)) as useful,
        COUNT(*) FILTER (WHERE v.type = 'useless'     AND p.user_id = $1)                     as useless,
        COUNT(*) FILTER (WHERE v.type = 'specialized' AND c.user_id = $1)                     as specialized
       FROM votes v
       LEFT JOIN posts    p ON p.id = v.post_id
       LEFT JOIN comments c ON c.id = v.comment_id`,
      [userId]
    ),
  ]);

  res.json({
    postsCount:        parseInt(posts.rows[0].count),
    commentsCount:     parseInt(comments.rows[0].count),
    usefulReceived:    parseInt(votes.rows[0].useful),
    uselessReceived:   parseInt(votes.rows[0].useless),
    specializedReceived: parseInt(votes.rows[0].specialized),
  });
};

const getMyReceivedVotes = async (req, res) => {
  const userId = req.user.id;
  const { type } = req.query;

  if (type === 'useful') {
    const [posts, comments] = await Promise.all([
      pool.query(
        `SELECT p.* FROM posts p
         JOIN votes v ON v.post_id = p.id
         WHERE p.user_id = $1 AND v.type = 'useful'`,
        [userId]
      ),
      pool.query(
        `SELECT c.* FROM comments c
         JOIN votes v ON v.comment_id = c.id
         WHERE c.user_id = $1 AND v.type = 'useful'`,
        [userId]
      ),
    ]);
    return res.json([
      ...posts.rows.map(p => ({ ...p, sourceType: 'post' })),
      ...comments.rows.map(c => ({ ...c, sourceType: 'comment' })),
    ]);
  }

  if (type === 'useless') {
    const result = await pool.query(
      `SELECT p.* FROM posts p
       JOIN votes v ON v.post_id = p.id
       WHERE p.user_id = $1 AND v.type = 'useless'`,
      [userId]
    );
    return res.json(result.rows.map(p => ({ ...p, sourceType: 'post' })));
  }

  if (type === 'specialized') {
    const result = await pool.query(
      `SELECT c.* FROM comments c
       JOIN votes v ON v.comment_id = c.id
       WHERE c.user_id = $1 AND v.type = 'specialized'`,
      [userId]
    );
    return res.json(result.rows.map(c => ({ ...c, sourceType: 'comment' })));
  }

  res.json([]);
};

const getPostsByUser = async (req, res) => {
  const posts = await postRepo.getPostsByUser(req.params.userId);
  res.json(posts);
};

const getCommentsByUser = async (req, res) => {
  const comments = await commentRepo.getCommentsByUser(req.params.userId);
  res.json(comments);
};

const getMyComments = async (req, res) => {
  const comments = await commentRepo.getCommentsByUser(req.user.id);
  res.json(comments);
};

// --- follows ---

const followUser = async (req, res) => {
  const followerId = req.user.id;
  const { userId: targetId } = req.params;

  const result = await userRepo.followUser(followerId, targetId);
  if (result.error) return res.status(400).json({ message: result.error });

  try {
    const target = await userRepo.findById(targetId);
    const follower = await userRepo.findById(followerId);
    await sendFollowEmail(target.email, follower.username);
  } catch (err) {
    console.error('Failed to send follow email:', err);
  }

  res.json({ message: 'Followed successfully' });
};

const unfollowUser = async (req, res) => {
  const followerId = req.user.id;
  const { userId: targetId } = req.params;

  const result = await userRepo.unfollowUser(followerId, targetId);
  if (result.error) return res.status(400).json({ message: result.error });

  res.json({ message: 'Unfollowed successfully' });
};

const getFollowers = async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.profile_pic_url, u.rating
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = $1`,
    [userId]
  );
  res.json(result.rows);
};

const getFollowing = async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.profile_pic_url, u.rating
     FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = $1`,
    [userId]
  );
  res.json(result.rows);
};

// --- reports ---

const reportUser = async (req, res) => {
  const { userId } = req.params;
  const { reason, details } = req.body;
  const reportedBy = req.user.id;

  if (!reason) return res.status(400).json({ message: 'Report reason is required' });
  if (reportedBy === userId) return res.status(400).json({ message: 'Cannot report yourself' });

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  try {
    await pool.query(
      `INSERT INTO reports (reported_by, reported_user_id, reason, details)
       VALUES ($1,$2,$3,$4)`,
      [reportedBy, userId, reason, details || null]
    );
    res.json({ message: 'User reported successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Already reported this user' });
    throw err;
  }
};

// --- professor reorientation ---

const selectMajorAfterRejection = async (req, res) => {
  const userId = req.user.id;
  const { selectedMajorId } = req.body;

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.pending_reorientation) return res.status(400).json({ message: 'No reorientation pending' });

  // verify user is enrolled in this major
  const majorCheck = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1 AND um.major_id = $2`,
    [userId, selectedMajorId]
  );
  if (majorCheck.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid major selection' });
  }

  // remove all other majors from user_majors
  await pool.query(
    `DELETE FROM user_majors WHERE user_id = $1 AND major_id != $2`,
    [userId, selectedMajorId]
  );

  // remove user from major/subject rooms that don't match selected major
  await pool.query(
    `DELETE FROM room_members
     WHERE user_id = $1
     AND room_id IN (
       SELECT r.id FROM rooms r
       WHERE r.type IN ('major','subject')
       AND r.major_id != $2
     )`,
    [userId, selectedMajorId]
  );

  await userRepo.updateUser(userId, { pendingReorientation: false });

  res.json({ message: 'Major selected successfully' });
};

// --- valid input correction ---

const selectValidInputs = async (req, res) => {
  const userId = req.user.id;
  const { selectedUniversityCode, selectedMajorIds } = req.body;

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.other_input_status !== 'rejected') {
    return res.status(400).json({ message: 'No input correction needed' });
  }

  // handle university correction
  if (selectedUniversityCode) {
    const uniCheck = await pool.query(
      `SELECT * FROM universities WHERE code = $1`,
      [selectedUniversityCode]
    );
    if (uniCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid university selection' });
    }
    const newUni = uniCheck.rows[0];

    // leave old university room, join new one
    await pool.query(
      `DELETE FROM room_members
       WHERE user_id = $1
       AND room_id IN (
         SELECT id FROM rooms WHERE type = 'university' AND university_code = $2
       )`,
      [userId, user.university_code]
    );

    const newUniRoom = await pool.query(
      `SELECT id FROM rooms WHERE type = 'university' AND university_code = $1`,
      [selectedUniversityCode]
    );
    if (newUniRoom.rows.length > 0) {
      await roomRepo.addMember(newUniRoom.rows[0].id, userId);
    }

    await userRepo.updateUser(userId, {
      universityCode: selectedUniversityCode,
      universityName: newUni.name,
    });
  }

  // handle major correction
  if (selectedMajorIds?.length) {
    // validate all selected majors exist in DB
    const validCheck = await pool.query(
      `SELECT id FROM majors WHERE id = ANY($1::uuid[])`,
      [selectedMajorIds]
    );
    if (validCheck.rows.length !== selectedMajorIds.length) {
      return res.status(400).json({ message: 'Invalid major selection' });
    }

    // get current invalid major ids (not in majors table)
    const currentMajors = await pool.query(
      `SELECT major_id FROM user_majors WHERE user_id = $1`,
      [userId]
    );
    const currentMajorIds = currentMajors.rows.map(r => r.major_id);

    const validMajors = await pool.query(
      `SELECT id FROM majors WHERE id = ANY($1::uuid[])`,
      [currentMajorIds]
    );
    const validCurrentIds = validMajors.rows.map(r => r.id);
    const invalidCurrentIds = currentMajorIds.filter(id => !validCurrentIds.includes(id));

    // leave rooms for invalid majors
    if (invalidCurrentIds.length > 0) {
      await pool.query(
        `DELETE FROM room_members
         WHERE user_id = $1
         AND room_id IN (
           SELECT id FROM rooms
           WHERE type IN ('major','subject')
           AND major_id = ANY($2::uuid[])
         )`,
        [userId, invalidCurrentIds]
      );
      await pool.query(
        `DELETE FROM user_majors WHERE user_id = $1 AND major_id = ANY($2::uuid[])`,
        [userId, invalidCurrentIds]
      );
    }

    // add new valid majors and join their rooms
    for (const majorId of selectedMajorIds) {
      await pool.query(
        `INSERT INTO user_majors (user_id, major_id) VALUES ($1,$2)
         ON CONFLICT (user_id, major_id) DO NOTHING`,
        [userId, majorId]
      );
      const majorRoom = await pool.query(
        `SELECT id FROM rooms WHERE type = 'major' AND major_id = $1`,
        [majorId]
      );
      if (majorRoom.rows.length > 0) {
        await roomRepo.addMember(majorRoom.rows[0].id, userId);
      }
    }
  }

  await userRepo.updateUser(userId, { otherInputStatus: 'corrected' });
  res.json({ message: 'Inputs updated successfully' });
};

const getMyMajors = async (req, res) => {
  const result = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1`,
    [req.user.id]
  );
  res.json(result.rows.map(r => r.name));
};

const getUserMajors = async (req, res) => {
  const result = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1`,
    [req.params.userId]
  );
  res.json(result.rows.map(r => r.name));
};

module.exports = {
  getMe,
  updateMe,
  deleteMe,
  getUserById,
  searchUsers,
  getMyStats,
  getStatsByUserId,
  getMyReceivedVotes,
  getPostsByUser,
  getCommentsByUser,
  getMyComments,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  reportUser,
  selectMajorAfterRejection,
  selectValidInputs,
  getMyMajors,
  getUserMajors,
};