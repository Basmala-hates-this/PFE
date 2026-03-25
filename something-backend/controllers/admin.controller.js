const userRepo = require("../repositories/user.repo");
const postRepo = require("../repositories/post.repo");
const roomRepo = require("../repositories/room.repo");
const fs = require("fs");
const path = require("path");

const logsPath = path.join(__dirname, "../data/logs.json");
const announcementsPath = path.join(__dirname, "../data/announcements.json");

// helpers 

const readLogs = () => JSON.parse(fs.readFileSync(logsPath, "utf8"));
const writeLogs = (data) => fs.writeFileSync(logsPath, JSON.stringify(data));
const readAnnouncements = () => JSON.parse(fs.readFileSync(announcementsPath, "utf8"));
const writeAnnouncements = (data) => fs.writeFileSync(announcementsPath, JSON.stringify(data));

const addLog = (adminId, adminUsername, action, targetId, details) => {
  const logs = readLogs();
  logs.push({
    id: Date.now().toString(),
    adminId,
    adminUsername,
    action,
    targetId,
    details,
    createdAt: new Date().toISOString()
  });
  writeLogs(logs);
};

//  permission check helper

const hasPermission = (user, permission) => {
  if (user.authorityLevel === "superadmin") return true;
  return user.permissions?.includes(permission);
};

//USER MANAGEMENT 

const getAllUsers = (req, res) => {
  const { q, role, status } = req.query;
  let users = userRepo.readUsers().map(({ password, ...u }) => u);

  if (q) users = users.filter(u => u.username?.toLowerCase().includes(q.toLowerCase()));
  if (role) users = users.filter(u => u.role === role);
  if (status === "suspended") users = users.filter(u => u.suspendedUntil && new Date(u.suspendedUntil) > new Date());
  if (status === "pending") users = users.filter(u => u.verificationStatus === "pending");

  res.json(users);
};

const suspendUser = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, "canSuspendUsers")) {
    return res.status(403).json({ message: "No permission to suspend users" });
  }

  const { userId } = req.params;
  const { days, reason } = req.body;

  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.authorityLevel !== "user") return res.status(403).json({ message: "Cannot suspend admins" });

  const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  userRepo.updateUser(userId, {
    suspendedUntil,
    suspensionReason: reason || "Policy violation",
    violationCount: (user.violationCount || 0) + 1,
    actionHistory: [...(user.actionHistory || []), {
      action: "suspended",
      by: req.user.username,
      reason,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "suspend_user", userId, `Suspended for ${days} days: ${reason}`);
  res.json({ message: `User suspended for ${days} days` });
};

const unsuspendUser = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, "canSuspendUsers")) {
    return res.status(403).json({ message: "No permission" });
  }

  const { userId } = req.params;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.updateUser(userId, {
    suspendedUntil: null,
    suspensionReason: null,
    actionHistory: [...(user.actionHistory || []), {
      action: "unsuspended",
      by: req.user.username,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "unsuspend_user", userId, "Suspension lifted");
  res.json({ message: "User unsuspended" });
};

const deleteUserAccount = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can delete accounts" });
  }

  const { userId } = req.params;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.deleteUser(userId);
  addLog(req.user.id, req.user.username, "delete_account", userId, `Deleted account @${user.username}`);
  res.json({ message: "Account deleted" });
};

// PROFESSOR VERIFICATION 

const getPendingProfessors = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, "canVerifyProfessors")) {
    return res.status(403).json({ message: "No permission" });
  }

  const pending = userRepo.readUsers()
    .filter(u => u.verificationStatus === "pending")
    .map(({ password, ...u }) => u);

  res.json(pending);
};

const verifyProfessor = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, "canVerifyProfessors")) {
    return res.status(403).json({ message: "No permission" });
  }

  const { userId } = req.params;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.updateUser(userId, {
    verificationStatus: "verified",
    actionHistory: [...(user.actionHistory || []), {
      action: "professor_verified",
      by: req.user.username,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "verify_professor", userId, `Verified @${user.username} as professor`);
  res.json({ message: "Professor verified" });
};

const rejectProfessor = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, "canVerifyProfessors")) {
    return res.status(403).json({ message: "No permission" });
  }

  const { userId } = req.params;
  const { reason } = req.body;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.updateUser(userId, {
    role: "student",
    verificationStatus: "rejected",
    pendingReorientation: user.majors?.length > 1,
    actionHistory: [...(user.actionHistory || []), {
      action: "professor_rejected",
      by: req.user.username,
      reason,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "reject_professor", userId, `Rejected @${user.username}: ${reason}`);
  res.json({ message: "Professor rejected and demoted to student" });
};

// CONTENT MODERATION 

const getReportedContent = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, "canHandleReports")) {
    return res.status(403).json({ message: "No permission" });
  }

  const posts = postRepo.getPostsAll();
  const reported = [];

  posts.forEach(post => {
    if (post.reports?.length > 0) {
      reported.push({ type: "post", ...post });
    }
    post.comments?.forEach(comment => {
      if (comment.reports?.length > 0) {
        reported.push({ type: "comment", postId: post.id, ...comment });
      }
    });
  });

  res.json(reported);
};

const hideContent = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, "canModerateContent")) {
    return res.status(403).json({ message: "No permission" });
  }

  const { type, postId, commentId } = req.body;
  const posts = postRepo.getPostsAll();

  if (type === "post") {
    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.isHidden = true;
    postRepo.writePosts(posts);
    addLog(req.user.id, req.user.username, "hide_post", postId, "Post hidden by admin");
  } else if (type === "comment") {
    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    comment.isHidden = true;
    postRepo.writePosts(posts);
    addLog(req.user.id, req.user.username, "hide_comment", commentId, "Comment hidden by admin");
  }

  res.json({ message: "Content hidden" });
};

const approveResource = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, "canModerateContent")) {
    return res.status(403).json({ message: "No permission" });
  }

  const { postId, approved } = req.body;
  const posts = postRepo.getPostsAll();
  const post = posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ message: "Post not found" });

  post.resourceApproved = approved;
  postRepo.writePosts(posts);

  addLog(req.user.id, req.user.username, approved ? "approve_resource" : "reject_resource", postId, `Resource ${approved ? "approved" : "rejected"}`);
  res.json({ message: `Resource ${approved ? "approved" : "rejected"}` });
};

// SUPERADMIN ONLY 

const upgradeToAdmin = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can upgrade users" });
  }

  const { userId } = req.params;
  const { permissions } = req.body;

  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.updateUser(userId, {
    authorityLevel: "admin",
    permissions: permissions || [],
    actionHistory: [...(user.actionHistory || []), {
      action: "upgraded_to_admin",
      by: req.user.username,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "upgrade_to_admin", userId, `Upgraded @${user.username} to admin`);
  res.json({ message: "User upgraded to admin" });
};

const removeAdmin = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can remove admins" });
  }

  const { userId } = req.params;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.updateUser(userId, {
    authorityLevel: "user",
    permissions: [],
    actionHistory: [...(user.actionHistory || []), {
      action: "admin_removed",
      by: req.user.username,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "remove_admin", userId, `Removed admin from @${user.username}`);
  res.json({ message: "Admin removed" });
};

const upgradToSuperAdmin = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can add superadmins" });
  }

  const { userId } = req.params;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.updateUser(userId, {
    authorityLevel: "superadmin",
    permissions: [],
    actionHistory: [...(user.actionHistory || []), {
      action: "upgraded_to_superadmin",
      by: req.user.username,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "upgrade_to_superadmin", userId, `Upgraded @${user.username} to superadmin`);
  res.json({ message: "User upgraded to superadmin" });
};

const getLogs = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can view logs" });
  }
  res.json(readLogs());
};

const getStats = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can view stats" });
  }

  const users = userRepo.readUsers();
  const posts = postRepo.getPostsAll();
  const rooms = roomRepo.getAllRooms();

  res.json({
    totalUsers: users.length,
    totalPosts: posts.length,
    totalComments: posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0),
    totalRooms: rooms.length,
    suspendedUsers: users.filter(u => u.suspendedUntil && new Date(u.suspendedUntil) > new Date()).length,
    pendingProfessors: users.filter(u => u.verificationStatus === "pending").length,
    reportedContent: posts.filter(p => p.reports?.length > 0).length,
  });
};

const getAnnouncements = (req, res) => {
  res.json(readAnnouncements());
};

const createAnnouncement = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can create announcements" });
  }

  const { message } = req.body;
  const announcements = readAnnouncements();
  const newAnnouncement = {
    id: Date.now().toString(),
    message,
    createdBy: req.user.username,
    createdAt: new Date().toISOString()
  };

  announcements.unshift(newAnnouncement);
  writeAnnouncements(announcements);
  addLog(req.user.id, req.user.username, "create_announcement", null, message);
  res.status(201).json(newAnnouncement);
};

const deleteAnnouncement = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can delete announcements" });
  }

  const { id } = req.params;
  const announcements = readAnnouncements().filter(a => a.id !== id);
  writeAnnouncements(announcements);
  res.json({ message: "Announcement deleted" });
};

module.exports = {
  getAllUsers,
  suspendUser,
  unsuspendUser,
  deleteUserAccount,
  getPendingProfessors,
  verifyProfessor,
  rejectProfessor,
  getReportedContent,
  hideContent,
  approveResource,
  upgradeToAdmin,
  removeAdmin,
  upgradToSuperAdmin,
  getLogs,
  getStats,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};