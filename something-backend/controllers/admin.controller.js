const userRepo = require("../repositories/user.repo");
const postRepo = require("../repositories/post.repo");
const roomRepo = require("../repositories/room.repo");
const fs = require("fs");
const path = require("path");


const logsPath = path.join(__dirname, "../data/logs.json");
const announcementsPath = path.join(__dirname, "../data/announcements.json");

const PERMISSIONS = require("../config/permissions");

const hasPermission = require("../utils/hasPermission");
const roomRequestsPath = path.join(__dirname, "../data/roomRequests.json");
const readRoomRequests = () => JSON.parse(fs.readFileSync(roomRequestsPath, "utf8"));
const writeRoomRequests = (data) => fs.writeFileSync(roomRequestsPath, JSON.stringify(data));

const { sendResetEmail,
   sendProfessorRejectionEmail,
   sendProfessorVerificationEmail,
  sendAdminApplicationAcceptedEmail,
  sendAdminApplicationRejectedEmail,
  sendRoomRequestApprovedEmail,
  sendRoomRequestRejectedEmail,
 } = require("../config/email");
const applicationsPath = path.join(__dirname, "../data/adminApplications.json");
const readApplications = () => JSON.parse(fs.readFileSync(applicationsPath, "utf8"));
const writeApplications = (data) => fs.writeFileSync(applicationsPath, JSON.stringify(data));

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

// const hasPermission = (user, permission) => {
//   if (user.authorityLevel === "superadmin") return true;
//   return user.permissions?.includes(permission);
// };
//isolated in utils...maybe i'll use it in another code later
// const hasPermission = (user, permission) => {
//   if (!user) return false;

//   if (user.authorityLevel === "superadmin") return true;

//   return Array.isArray(user.permissions) && user.permissions.includes(permission);
// };

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
  if (!hasPermission(admin, PERMISSIONS.SUSPEND_USERS)) {
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
  if (!hasPermission(admin, PERMISSIONS.SUSPEND_USERS)) {
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
  if (!hasPermission(admin, PERMISSIONS.VERIFY_PROFESSORS)){
    return res.status(403).json({ message: "No permission" });
  }

  const pending = userRepo.readUsers()
    .filter(u => u.verificationStatus === "pending")
    .map(({ password, ...u }) => u);

  res.json(pending);
};

const verifyProfessor = async(req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.VERIFY_PROFESSORS)) {
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
  try {
    await sendProfessorVerificationEmail(user.email, user.username);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  addLog(req.user.id, req.user.username, "verify_professor", userId, `Verified @${user.username} as professor`);
  res.json({ message: "Professor verified" });
};

const rejectProfessor =async (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.VERIFY_PROFESSORS)) {
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

  try {
    await sendProfessorRejectionEmail(user.email, user.username, reason);
  } catch (err) {
    console.error("Failed to send rejection email:", err);
  }


  addLog(req.user.id, req.user.username, "reject_professor", userId, `Rejected @${user.username}: ${reason}`);
  res.json({ message: "Professor rejected and demoted to student" });
};

// CONTENT MODERATION 

const getReportedContent = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.HANDLE_REPORTS)) {
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
  if (!hasPermission(admin, PERMISSIONS.MODERATE_CONTENT)) {
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
  if (!hasPermission(admin, PERMISSIONS.APPROVE_RESOURCES)) {
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

const upgradeToAdmin = async (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can upgrade users" });
  }

  const { userId } = req.params;
  const { permissions, assignedRooms } = req.body;

  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.updateUser(userId, {
    authorityLevel: "admin",
    permissions: permissions || [],
    assignedRooms: assignedRooms || [], 
    actionHistory: [...(user.actionHistory || []), {
      action: "upgraded_to_admin",
      by: req.user.username,
      date: new Date().toISOString()
    }]
  });

  // remove application
  const applications = readApplications();
  writeApplications(applications.filter(a => a.userId !== userId));

  try {
    await sendAdminApplicationAcceptedEmail(user.email, user.username);
  } catch (err) {
    console.error("Failed to send acceptance email:", err);
  }

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

const getAllPostsAdmin = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "No permission" });
  }
  const posts = postRepo.getPostsAll();
  res.json(posts);
};

const getAllRoomsAdmin = (req, res) => {
  if (!hasPermission(userRepo.findById(req.user.id), PERMISSIONS.MANAGE_ROOMS)) {
    return res.status(403).json({ message: "No permission" });
  }
  const rooms = roomRepo.getAllRooms();
  res.json(rooms);
};

// resources
const getPendingResources = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.APPROVE_RESOURCES)) {
    return res.status(403).json({ message: "No permission" });
  }
  const posts = postRepo.getPostsAll();
  const pending = posts.filter(p =>
    (p.pdf || p.image || p.resourceLink) && p.resourceApproved === null
  );
  res.json(pending);
};

// hidden Content
const getHiddenContent = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.MODERATE_CONTENT)) {
    return res.status(403).json({ message: "No permission" });
  }
  const posts = postRepo.getPostsAll();
  const hidden = [];
  posts.forEach(post => {
    if (post.isHidden) hidden.push({ type: "post", ...post });
    post.comments?.forEach(comment => {
      if (comment.isHidden) hidden.push({ type: "comment", postId: post.id, postTitle: post.title, ...comment });
    });
  });
  res.json(hidden);
};

// restore hidden content
const restoreContent = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.MODERATE_CONTENT)) {
    return res.status(403).json({ message: "No permission" });
  }
  const { type, postId, commentId } = req.body;
  const posts = postRepo.getPostsAll();

  if (type === "post") {
    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.isHidden = false;
    post.autoHidden = false;
    postRepo.writePosts(posts);
    addLog(req.user.id, req.user.username, "restore_post", postId, "Post restored");
  } else if (type === "comment") {
    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    comment.isHidden = false;
    comment.autoHidden = false;
    postRepo.writePosts(posts);
    addLog(req.user.id, req.user.username, "restore_comment", commentId, "Comment restored");
  }
  res.json({ message: "Content restored" });
};

// other inputs
const DEFAULT_UNI_CODES = [
  "UA1","UA2","UA3","USTHB","ENP","ESNA","NHV","BMU",
  "UB1","UB2","UBj","UBs","UBl1","Ubl2","UCh",
  "UC1","UC2","UC3","UD","UG","UJ","UL","UM","UMs",
  "UO1","UO2","USTO","UOr","USa","USBA","USk","USA",
  "US1","US2","UTi","UTl","UTO"
];

const DEFAULT_MAJORS = [
  "Computer Science","Mathematics","Physics","Chemistry","Biology",
  "Civil Engineering","Mechanical Engineering","Electrical Engineering",
  "Process Engineering","Architecture","Natural and Life Science","Agronomy",
  "Renewable Energies","Geology","Medicine","Pharmacy","Dental Medicine",
  "Veterinary Medicine","Law","Political Science & International Relations",
  "Economics & Commerce & Management Science","History","Psychology",
  "Sociology","Philosophy","Literature & Languages",
  "Information & Communucation Science","Sport Science & Physical Education",
  "Art & Design"
];

const getOtherInputs = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.VALIDATE_OTHER)) {
    return res.status(403).json({ message: "No permission" });
  }
  const users = userRepo.readUsers();
  const flagged = [];

  users.forEach(({ password, ...u }) => {
    const customUni = u.university?.code && !DEFAULT_UNI_CODES.includes(u.university.code)
      ? u.university : null;
    const customMajors = u.majors?.filter(m => !DEFAULT_MAJORS.includes(m)) || [];

    if (customUni || customMajors.length > 0) {
      flagged.push({
        ...u,
        customUni,
        customMajors,
        otherInputStatus: u.otherInputStatus || "pending"
      });
    }
  });

  res.json(flagged);
};

const validateOtherInput = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.VALIDATE_OTHER)) {
    return res.status(403).json({ message: "No permission" });
  }
  const { userId, approved } = req.body;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  userRepo.updateUser(userId, {
    otherInputStatus: approved ? "approved" : "rejected",
    actionHistory: [...(user.actionHistory || []), {
      action: approved ? "other_input_approved" : "other_input_rejected",
      by: req.user.username,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username,
    approved ? "approve_other_input" : "reject_other_input",
    userId, `Custom input ${approved ? "approved" : "rejected"} for @${user.username}`
  );
  res.json({ message: `Input ${approved ? "approved" : "rejected"}` });
};


// ADMIN APPLICATIONS

const applyForAdmin= (req, res) => {
  const user = userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if ((user.rating ?? 1) < 3.5) {
    return res.status(403).json({ message: "Rating too low to apply" });
  }

  if (user.authorityLevel !== "user") {
    return res.status(400).json({ message: "Already an admin" });
  }

  const applications = readApplications();

  const existing = applications.find(a => a.userId === user.id);
  if (existing) {
    return res.status(400).json({ message: "You already have a pending application" });
  }

  applications.push({
    userId: user.id,
    username: user.username,
    email: user.email,
    rating: user.rating ?? 1,
    appliedAt: new Date().toISOString()
  });

  writeApplications(applications);
  res.json({ message: "Application submitted!" });
};

const withdrawApplication = (req, res) => {
  const applications = readApplications();
  const app = applications.find(a => a.userId === req.user.id);

  if (!app) return res.status(404).json({ message: "No application found" });

  const hoursSince = (Date.now() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60);
  if (hoursSince > 2) {
    return res.status(403).json({ 
      message: "Withdrawal window has passed. Please contact a superadmin to remove your application." 
    });
  }

  writeApplications(applications.filter(a => a.userId !== req.user.id));
  res.json({ message: "Application withdrawn." });
};

const getApplications = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can view applications" });
  }
  res.json(readApplications());
};

const rejectApplication = async (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can reject applications" });
  }

  const { userId, reason } = req.body;
  const applications = readApplications();
  const app = applications.find(a => a.userId === userId);
  if (!app) return res.status(404).json({ message: "Application not found" });

  writeApplications(applications.filter(a => a.userId !== userId));

  const user = userRepo.findById(userId);
  try {
    await sendAdminApplicationRejectedEmail(user.email, user.username, reason);
  } catch (err) {
    console.error("Failed to send rejection email:", err);
  }

  addLog(req.user.id, req.user.username, "reject_admin_application", userId, 
    `Rejected admin application from @${app.username}: ${reason}`);
  res.json({ message: "Application rejected." });
};


// ROOM REQUESTS...KILL ME PLS

const requestSubjectRoom = (req, res) => {
  const user = userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { major, subject } = req.body;
  if (!major || !subject) return res.status(400).json({ message: "Major and subject are required" });

  // make sure major belongs to user
  if (!user.majors?.includes(major)) {
    return res.status(403).json({ message: "You can only request rooms for your own majors" });
  }

  const requests = readRoomRequests();

  // check for duplicate pending request
  const duplicate = requests.find(
    r => r.major === major && 
    r.subject.toLowerCase() === subject.toLowerCase() && 
    r.status === "pending"
  );

  if (duplicate) {
    // add user to notifyUsers if not already there
    if (!duplicate.notifyUsers.includes(req.user.id)) {
      duplicate.notifyUsers.push(req.user.id);
      writeRoomRequests(requests);
    }
    return res.status(200).json({ 
      message: "A request for this room is already pending. You'll be notified when it's approved." 
    });
  }

  requests.push({
    id: Date.now().toString(),
    userId: req.user.id,
    username: req.user.username,
    email: user.email,
    major,
    subject,
    status: "pending",
    requestedAt: new Date().toISOString(),
    notifyUsers: [req.user.id] // everyone to notify on approval
  });

  writeRoomRequests(requests);
  res.json({ message: "Room request submitted! You'll be notified when it's reviewed." });
};

const getRoomRequests = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
    return res.status(403).json({ message: "No permission" });
  }
  res.json(readRoomRequests().filter(r => r.status === "pending"));
};

const handleRoomRequest = async (req, res) => {
  const admin = userRepo.findById(req.user.id);
  if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
    return res.status(403).json({ message: "No permission" });
  }

  const { requestId, approved, reason } = req.body;
  const requests = readRoomRequests();
  const request = requests.find(r => r.id === requestId);
  if (!request) return res.status(404).json({ message: "Request not found" });

  request.status = approved ? "approved" : "rejected";
  writeRoomRequests(requests);

  if (approved) {
    // create the room
    const rooms = roomRepo.getAllRooms();
    const newRoom = {
      id: Date.now().toString(),
      name: request.subject,
      type: "subject",
      major: request.major,
      members: request.notifyUsers,
      createdAt: new Date().toISOString()
    };
    rooms.push(newRoom);
    roomRepo.writeRooms(rooms);

    // add room to each notified user
    request.notifyUsers.forEach(userId => {
      const u = userRepo.findById(userId);
      if (u) {
        userRepo.updateUser(userId, {
          rooms: [...(u.rooms || []), newRoom.id]
        });
      }
    });

    // send approval emails to all notifyUsers
    for (const userId of request.notifyUsers) {
      const u = userRepo.findById(userId);
      if (u) {
        try {
          await sendRoomRequestApprovedEmail(u.email, u.username, request.subject, request.major);
        } catch (err) {
          console.error("Failed to send approval email:", err);
        }
      }
    }

    addLog(req.user.id, req.user.username, "approve_room_request", requestId,
      `Approved room "${request.subject}" under ${request.major}`);
  } else {
    // rejection email only to original requester
    try {
      await sendRoomRequestRejectedEmail(request.email, request.username, request.subject, request.major, reason);
    } catch (err) {
      console.error("Failed to send rejection email:", err);
    }

    addLog(req.user.id, req.user.username, "reject_room_request", requestId,
      `Rejected room "${request.subject}" under ${request.major}: ${reason}`);
  }

  res.json({ message: approved ? "Room created and users notified." : "Request rejected." });
};

//room moderation shit face
// ROOM MODERATION

const getRoomsForAdmin = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  const rooms = roomRepo.getAllRooms();

  if (req.user.authorityLevel === "superadmin") {
    return res.json(rooms);
  }

  if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
    return res.status(403).json({ message: "No permission" });
  }

  // only return assigned rooms
  const assignedRooms = rooms.filter(r => 
    admin.assignedRooms?.includes(r.id)
  );
  res.json(assignedRooms);
};

const suspendFromRoom = (req, res) => {
  const admin = userRepo.findById(req.user.id);
  
  if (req.user.authorityLevel !== "superadmin") {
    if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
      return res.status(403).json({ message: "No permission" });
    }
    // check admin is assigned to this room
    if (!admin.assignedRooms?.includes(req.body.roomId)) {
      return res.status(403).json({ message: "You are not assigned to this room" });
    }
  }

  const { roomId, userId, days, reason } = req.body;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  
  roomRepo.suspendMemberFromRoom(roomId, userId, until, reason);

  // increment room violation count
  const roomViolations = user.roomViolations || {};
  roomViolations[roomId] = (roomViolations[roomId] || 0) + 1;
  
  userRepo.updateUser(userId, {
    violationCount: (user.violationCount || 0) + 1,
    roomViolations,
    actionHistory: [...(user.actionHistory || []), {
      action: "room_suspended",
      roomId,
      by: req.user.username,
      reason,
      until,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "room_suspend", userId,
    `Suspended @${user.username} from room ${roomId} for ${days} days: ${reason}`);
  res.json({ message: `User suspended from room for ${days} days` });
};

const unsuspendFromRoom = (req, res) => {
  const admin = userRepo.findById(req.user.id);

  if (req.user.authorityLevel !== "superadmin") {
    if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
      return res.status(403).json({ message: "No permission" });
    }
    if (!admin.assignedRooms?.includes(req.body.roomId)) {
      return res.status(403).json({ message: "You are not assigned to this room" });
    }
  }

  const { roomId, userId } = req.body;
  const user = userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  roomRepo.unsuspendMemberFromRoom(roomId, userId);

  userRepo.updateUser(userId, {
    actionHistory: [...(user.actionHistory || []), {
      action: "room_unsuspended",
      roomId,
      by: req.user.username,
      date: new Date().toISOString()
    }]
  });

  addLog(req.user.id, req.user.username, "room_unsuspend", userId,
    `Lifted room suspension for @${user.username} in room ${roomId}`);
  res.json({ message: "Room suspension lifted" });
};

const deleteRoomAdmin = (req, res) => {
  if (req.user.authorityLevel !== "superadmin") {
    return res.status(403).json({ message: "Only superadmin can delete rooms" });
  }

  const { roomId } = req.params;
  const room = roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: "Room not found" });

  const rooms = roomRepo.getAllRooms().filter(r => r.id !== roomId);
  roomRepo.writeRooms(rooms);

  addLog(req.user.id, req.user.username, "delete_room", roomId,
    `Deleted room "${room.name}"`);
  res.json({ message: "Room deleted" });
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
  getAllPostsAdmin,
  getAllRoomsAdmin,
  getPendingResources,
  getOtherInputs,
  validateOtherInput,
  restoreContent,
  getHiddenContent,
  applyForAdmin,
  withdrawApplication,
  getApplications,
  rejectApplication,
  requestSubjectRoom,
  getRoomRequests,
  handleRoomRequest,
  getRoomsForAdmin,
  suspendFromRoom,
  unsuspendFromRoom,
  deleteRoomAdmin,
};

//this one is getting humangasoures....this is bad but not so bad...it has all admin shit which is bad...