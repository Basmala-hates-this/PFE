// const userRepo = require("../repositories/user.repo");
// const postRepo = require("../repositories/post.repo");
// const roomRepo = require("../repositories/room.repo");
// const fs = require("fs");
// const path = require("path");


// const logsPath = path.join(__dirname, "../data/logs.json");
// const announcementsPath = path.join(__dirname, "../data/announcements.json");

// const PERMISSIONS = require("../config/permissions");

// const hasPermission = require("../utils/hasPermission");
// const roomRequestsPath = path.join(__dirname, "../data/roomRequests.json");
// const readRoomRequests = () => JSON.parse(fs.readFileSync(roomRequestsPath, "utf8"));
// const writeRoomRequests = (data) => fs.writeFileSync(roomRequestsPath, JSON.stringify(data));

// const { sendResetEmail,
//    sendProfessorRejectionEmail,
//    sendProfessorVerificationEmail,
//   sendAdminApplicationAcceptedEmail,
//   sendAdminApplicationRejectedEmail,
//   sendRoomRequestApprovedEmail,
//   sendRoomRequestRejectedEmail,
//  } = require("../config/email");
// const applicationsPath = path.join(__dirname, "../data/adminApplications.json");
// const readApplications = () => JSON.parse(fs.readFileSync(applicationsPath, "utf8"));
// const writeApplications = (data) => fs.writeFileSync(applicationsPath, JSON.stringify(data));

// // helpers 

// const readLogs = () => JSON.parse(fs.readFileSync(logsPath, "utf8"));
// const writeLogs = (data) => fs.writeFileSync(logsPath, JSON.stringify(data));
// const readAnnouncements = () => JSON.parse(fs.readFileSync(announcementsPath, "utf8"));
// const writeAnnouncements = (data) => fs.writeFileSync(announcementsPath, JSON.stringify(data));

// const addLog = (adminId, adminUsername, action, targetId, details) => {
//   const logs = readLogs();
//   logs.push({
//     id: Date.now().toString(),
//     adminId,
//     adminUsername,
//     action,
//     targetId,
//     details,
//     createdAt: new Date().toISOString()
//   });
//   writeLogs(logs);
// };

// //  permission check helper

// // const hasPermission = (user, permission) => {
// //   if (user.authorityLevel === "superadmin") return true;
// //   return user.permissions?.includes(permission);
// // };
// //isolated in utils...maybe i'll use it in another code later
// // const hasPermission = (user, permission) => {
// //   if (!user) return false;

// //   if (user.authorityLevel === "superadmin") return true;

// //   return Array.isArray(user.permissions) && user.permissions.includes(permission);
// // };

// //USER MANAGEMENT 

// const getAllUsers = (req, res) => {
//   const { q, role, status } = req.query;
//   let users = userRepo.readUsers().map(({ password, ...u }) => u);

//   if (q) users = users.filter(u => u.username?.toLowerCase().includes(q.toLowerCase()));
//   if (role) users = users.filter(u => u.role === role);
//   if (status === "suspended") users = users.filter(u => u.suspendedUntil && new Date(u.suspendedUntil) > new Date());
//   if (status === "pending") users = users.filter(u => u.verificationStatus === "pending");

//   res.json(users);
// };

// const suspendUser = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.SUSPEND_USERS)) {
//     return res.status(403).json({ message: "No permission to suspend users" });
//   }

//   const { userId } = req.params;
//   const { days, reason } = req.body;

//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });
//   if (user.authorityLevel !== "user") return res.status(403).json({ message: "Cannot suspend admins" });

//   const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

//   userRepo.updateUser(userId, {
//     suspendedUntil,
//     suspensionReason: reason || "Policy violation",
//     violationCount: (user.violationCount || 0) + 1,
//     actionHistory: [...(user.actionHistory || []), {
//       action: "suspended",
//       by: req.user.username,
//       reason,
//       date: new Date().toISOString()
//     }]
//   });

//   addLog(req.user.id, req.user.username, "suspend_user", userId, `Suspended for ${days} days: ${reason}`);
//   res.json({ message: `User suspended for ${days} days` });
// };

// const unsuspendUser = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.SUSPEND_USERS)) {
//     return res.status(403).json({ message: "No permission" });
//   }

//   const { userId } = req.params;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.updateUser(userId, {
//     suspendedUntil: null,
//     suspensionReason: null,
//     actionHistory: [...(user.actionHistory || []), {
//       action: "unsuspended",
//       by: req.user.username,
//       date: new Date().toISOString()
//     }]
//   });

//   addLog(req.user.id, req.user.username, "unsuspend_user", userId, "Suspension lifted");
//   res.json({ message: "User unsuspended" });
// };

// const deleteUserAccount = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can delete accounts" });
//   }

//   const { userId } = req.params;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.deleteUser(userId);
//   addLog(req.user.id, req.user.username, "delete_account", userId, `Deleted account @${user.username}`);
//   res.json({ message: "Account deleted" });
// };

// // PROFESSOR VERIFICATION 

// const getPendingProfessors = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.VERIFY_PROFESSORS)){
//     return res.status(403).json({ message: "No permission" });
//   }

//   const pending = userRepo.readUsers()
//     .filter(u => u.verificationStatus === "pending")
//     .map(({ password, ...u }) => u);

//   res.json(pending);
// };

// const verifyProfessor = async(req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.VERIFY_PROFESSORS)) {
//     return res.status(403).json({ message: "No permission" });
//   }

//   const { userId } = req.params;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.updateUser(userId, {
//     verificationStatus: "verified",
//     actionHistory: [...(user.actionHistory || []), {
//       action: "professor_verified",
//       by: req.user.username,
//       date: new Date().toISOString()
//     }]
//   });
//   try {
//     await sendProfessorVerificationEmail(user.email, user.username);
//   } catch (err) {
//     console.error("Failed to send verification email:", err);
//   }

//   addLog(req.user.id, req.user.username, "verify_professor", userId, `Verified @${user.username} as professor`);
//   res.json({ message: "Professor verified" });
// };

// const rejectProfessor =async (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.VERIFY_PROFESSORS)) {
//     return res.status(403).json({ message: "No permission" });
//   }

//   const { userId } = req.params;
//   const { reason } = req.body;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.updateUser(userId, {
//     role: "student",
//     verificationStatus: "rejected",
//     pendingReorientation: user.majors?.length > 1,
//     actionHistory: [...(user.actionHistory || []), {
//       action: "professor_rejected",
//       by: req.user.username,
//       reason,
//       date: new Date().toISOString()
//     }]
//   });

//   try {
//     await sendProfessorRejectionEmail(user.email, user.username, reason);
//   } catch (err) {
//     console.error("Failed to send rejection email:", err);
//   }


//   addLog(req.user.id, req.user.username, "reject_professor", userId, `Rejected @${user.username}: ${reason}`);
//   res.json({ message: "Professor rejected and demoted to student" });
// };

// // CONTENT MODERATION 

// const getReportedContent = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.HANDLE_REPORTS)) {
//     return res.status(403).json({ message: "No permission" });
//   }

//   const posts = postRepo.getPostsAll();
//   const reported = [];

//   posts.forEach(post => {
//     if (post.reports?.length > 0) {
//       reported.push({ type: "post", ...post });
//     }
//     post.comments?.forEach(comment => {
//       if (comment.reports?.length > 0) {
//         reported.push({ type: "comment", postId: post.id, ...comment });
//       }
//     });
//   });

//   res.json(reported);
// };

// const hideContent = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.MODERATE_CONTENT)) {
//     return res.status(403).json({ message: "No permission" });
//   }

//   const { type, postId, commentId } = req.body;
//   const posts = postRepo.getPostsAll();

//   if (type === "post") {
//     const post = posts.find(p => p.id === postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });
//     post.isHidden = true;
//     postRepo.writePosts(posts);
//     addLog(req.user.id, req.user.username, "hide_post", postId, "Post hidden by admin");
//   } else if (type === "comment") {
//     const post = posts.find(p => p.id === postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });
//     const comment = post.comments.find(c => c.id === commentId);
//     if (!comment) return res.status(404).json({ message: "Comment not found" });
//     comment.isHidden = true;
//     postRepo.writePosts(posts);
//     addLog(req.user.id, req.user.username, "hide_comment", commentId, "Comment hidden by admin");
//   }

//   res.json({ message: "Content hidden" });
// };

// const approveResource = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.APPROVE_RESOURCES)) {
//     return res.status(403).json({ message: "No permission" });
//   }

//   const { postId, approved } = req.body;
//   const posts = postRepo.getPostsAll();
//   const post = posts.find(p => p.id === postId);
//   if (!post) return res.status(404).json({ message: "Post not found" });

//   post.resourceApproved = approved;
//   postRepo.writePosts(posts);

//   addLog(req.user.id, req.user.username, approved ? "approve_resource" : "reject_resource", postId, `Resource ${approved ? "approved" : "rejected"}`);
//   res.json({ message: `Resource ${approved ? "approved" : "rejected"}` });
// };

// // SUPERADMIN ONLY 

// const upgradeToAdmin = async (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can upgrade users" });
//   }

//   const { userId } = req.params;
//   const { permissions, assignedRooms } = req.body;

//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.updateUser(userId, {
//     authorityLevel: "admin",
//     permissions: permissions || [],
//     assignedRooms: assignedRooms || [], 
//     actionHistory: [...(user.actionHistory || []), {
//       action: "upgraded_to_admin",
//       by: req.user.username,
//       date: new Date().toISOString()
//     }]
//   });

//   // remove application
//   const applications = readApplications();
//   writeApplications(applications.filter(a => a.userId !== userId));

//   try {
//     await sendAdminApplicationAcceptedEmail(user.email, user.username);
//   } catch (err) {
//     console.error("Failed to send acceptance email:", err);
//   }

//   addLog(req.user.id, req.user.username, "upgrade_to_admin", userId, `Upgraded @${user.username} to admin`);
//   res.json({ message: "User upgraded to admin" });
// };

// const removeAdmin = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can remove admins" });
//   }

//   const { userId } = req.params;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.updateUser(userId, {
//     authorityLevel: "user",
//     permissions: [],
//     actionHistory: [...(user.actionHistory || []), {
//       action: "admin_removed",
//       by: req.user.username,
//       date: new Date().toISOString()
//     }]
//   });

//   addLog(req.user.id, req.user.username, "remove_admin", userId, `Removed admin from @${user.username}`);
//   res.json({ message: "Admin removed" });
// };

// const upgradToSuperAdmin = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can add superadmins" });
//   }

//   const { userId } = req.params;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.updateUser(userId, {
//     authorityLevel: "superadmin",
//     permissions: [],
//     actionHistory: [...(user.actionHistory || []), {
//       action: "upgraded_to_superadmin",
//       by: req.user.username,
//       date: new Date().toISOString()
//     }]
//   });

//   addLog(req.user.id, req.user.username, "upgrade_to_superadmin", userId, `Upgraded @${user.username} to superadmin`);
//   res.json({ message: "User upgraded to superadmin" });
// };

// const getLogs = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can view logs" });
//   }
//   res.json(readLogs());
// };

// const getStats = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can view stats" });
//   }

//   const users = userRepo.readUsers();
//   const posts = postRepo.getPostsAll();
//   const rooms = roomRepo.getAllRooms();

//   res.json({
//     totalUsers: users.length,
//     totalPosts: posts.length,
//     totalComments: posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0),
//     totalRooms: rooms.length,
//     suspendedUsers: users.filter(u => u.suspendedUntil && new Date(u.suspendedUntil) > new Date()).length,
//     pendingProfessors: users.filter(u => u.verificationStatus === "pending").length,
//     reportedContent: posts.filter(p => p.reports?.length > 0).length,
//   });
// };

// const getAnnouncements = (req, res) => {
//   res.json(readAnnouncements());
// };

// const createAnnouncement = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can create announcements" });
//   }

//   const { message } = req.body;
//   const announcements = readAnnouncements();
//   const newAnnouncement = {
//     id: Date.now().toString(),
//     message,
//     createdBy: req.user.username,
//     createdAt: new Date().toISOString()
//   };

//   announcements.unshift(newAnnouncement);
//   writeAnnouncements(announcements);
//   addLog(req.user.id, req.user.username, "create_announcement", null, message);
//   res.status(201).json(newAnnouncement);
// };

// const deleteAnnouncement = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can delete announcements" });
//   }

//   const { id } = req.params;
//   const announcements = readAnnouncements().filter(a => a.id !== id);
//   writeAnnouncements(announcements);
//   res.json({ message: "Announcement deleted" });
// };

// const getAllPostsAdmin = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "No permission" });
//   }
//   const posts = postRepo.getPostsAll();
//   res.json(posts);
// };

// const getAllRoomsAdmin = (req, res) => {
//   if (!hasPermission(userRepo.findById(req.user.id), PERMISSIONS.MANAGE_ROOMS)) {
//     return res.status(403).json({ message: "No permission" });
//   }
//   const rooms = roomRepo.getAllRooms();
//   res.json(rooms);
// };

// // resources
// const getPendingResources = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.APPROVE_RESOURCES)) {
//     return res.status(403).json({ message: "No permission" });
//   }
//   const posts = postRepo.getPostsAll();
//   const pending = posts.filter(p =>
//     (p.pdf || p.image || p.resourceLink) && p.resourceApproved === null
//   );
//   res.json(pending);
// };

// // hidden Content
// const getHiddenContent = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.MODERATE_CONTENT)) {
//     return res.status(403).json({ message: "No permission" });
//   }
//   const posts = postRepo.getPostsAll();
//   const hidden = [];
//   posts.forEach(post => {
//     if (post.isHidden) hidden.push({ type: "post", ...post });
//     post.comments?.forEach(comment => {
//       if (comment.isHidden) hidden.push({ type: "comment", postId: post.id, postTitle: post.title, ...comment });
//     });
//   });
//   res.json(hidden);
// };

// // restore hidden content
// const restoreContent = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.MODERATE_CONTENT)) {
//     return res.status(403).json({ message: "No permission" });
//   }
//   const { type, postId, commentId } = req.body;
//   const posts = postRepo.getPostsAll();

//   if (type === "post") {
//     const post = posts.find(p => p.id === postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });
//     post.isHidden = false;
//     post.autoHidden = false;
//     postRepo.writePosts(posts);
//     addLog(req.user.id, req.user.username, "restore_post", postId, "Post restored");
//   } else if (type === "comment") {
//     const post = posts.find(p => p.id === postId);
//     if (!post) return res.status(404).json({ message: "Post not found" });
//     const comment = post.comments.find(c => c.id === commentId);
//     if (!comment) return res.status(404).json({ message: "Comment not found" });
//     comment.isHidden = false;
//     comment.autoHidden = false;
//     postRepo.writePosts(posts);
//     addLog(req.user.id, req.user.username, "restore_comment", commentId, "Comment restored");
//   }
//   res.json({ message: "Content restored" });
// };

// // other inputs
// const DEFAULT_UNI_CODES = [
//   "UA1","UA2","UA3","USTHB","ENP","ESNA","NHV","BMU",
//   "UB1","UB2","UBj","UBs","UBl1","Ubl2","UCh",
//   "UC1","UC2","UC3","UD","UG","UJ","UL","UM","UMs",
//   "UO1","UO2","USTO","UOr","USa","USBA","USk","USA",
//   "US1","US2","UTi","UTl","UTO"
// ];

// const DEFAULT_MAJORS = [
//   "Computer Science","Mathematics","Physics","Chemistry","Biology",
//   "Civil Engineering","Mechanical Engineering","Electrical Engineering",
//   "Process Engineering","Architecture","Natural and Life Science","Agronomy",
//   "Renewable Energies","Geology","Medicine","Pharmacy","Dental Medicine",
//   "Veterinary Medicine","Law","Political Science & International Relations",
//   "Economics & Commerce & Management Science","History","Psychology",
//   "Sociology","Philosophy","Literature & Languages",
//   "Information & Communucation Science","Sport Science & Physical Education",
//   "Art & Design"
// ];

// const getOtherInputs = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.VALIDATE_OTHER)) {
//     return res.status(403).json({ message: "No permission" });
//   }
//   const users = userRepo.readUsers();
//   const flagged = [];

//   users.forEach(({ password, ...u }) => {
//     const customUni = u.university?.code && !DEFAULT_UNI_CODES.includes(u.university.code)
//       ? u.university : null;
//     const customMajors = u.majors?.filter(m => !DEFAULT_MAJORS.includes(m)) || [];

//     if (customUni || customMajors.length > 0) {
//       flagged.push({
//         ...u,
//         customUni,
//         customMajors,
//         otherInputStatus: u.otherInputStatus || "pending"
//       });
//     }
//   });

//   res.json(flagged);
// };

// const validateOtherInput = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.VALIDATE_OTHER)) {
//     return res.status(403).json({ message: "No permission" });
//   }
//   const { userId, approved } = req.body;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.updateUser(userId, {
//     otherInputStatus: approved ? "approved" : "rejected",
//     actionHistory: [...(user.actionHistory || []), {
//       action: approved ? "other_input_approved" : "other_input_rejected",
//       by: req.user.username,
//       date: new Date().toISOString()
//     }]
//   });

//   addLog(req.user.id, req.user.username,
//     approved ? "approve_other_input" : "reject_other_input",
//     userId, `Custom input ${approved ? "approved" : "rejected"} for @${user.username}`
//   );
//   res.json({ message: `Input ${approved ? "approved" : "rejected"}` });
// };


// // ADMIN APPLICATIONS

// const applyForAdmin= (req, res) => {
//   const user = userRepo.findById(req.user.id);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   if ((user.rating ?? 1) < 3.5) {
//     return res.status(403).json({ message: "Rating too low to apply" });
//   }

//   if (user.authorityLevel !== "user") {
//     return res.status(400).json({ message: "Already an admin" });
//   }

//   const applications = readApplications();

//   const existing = applications.find(a => a.userId === user.id);
//   if (existing) {
//     return res.status(400).json({ message: "You already have a pending application" });
//   }

//   applications.push({
//     userId: user.id,
//     username: user.username,
//     email: user.email,
//     rating: user.rating ?? 1,
//     appliedAt: new Date().toISOString()
//   });

//   writeApplications(applications);
//   res.json({ message: "Application submitted!" });
// };

// const withdrawApplication = (req, res) => {
//   const applications = readApplications();
//   const app = applications.find(a => a.userId === req.user.id);

//   if (!app) return res.status(404).json({ message: "No application found" });

//   const hoursSince = (Date.now() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60);
//   if (hoursSince > 2) {
//     return res.status(403).json({ 
//       message: "Withdrawal window has passed. Please contact a superadmin to remove your application." 
//     });
//   }

//   writeApplications(applications.filter(a => a.userId !== req.user.id));
//   res.json({ message: "Application withdrawn." });
// };

// const getApplications = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can view applications" });
//   }
//   res.json(readApplications());
// };

// const rejectApplication = async (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can reject applications" });
//   }

//   const { userId, reason } = req.body;
//   const applications = readApplications();
//   const app = applications.find(a => a.userId === userId);
//   if (!app) return res.status(404).json({ message: "Application not found" });

//   writeApplications(applications.filter(a => a.userId !== userId));

//   const user = userRepo.findById(userId);
//   try {
//     await sendAdminApplicationRejectedEmail(user.email, user.username, reason);
//   } catch (err) {
//     console.error("Failed to send rejection email:", err);
//   }

//   addLog(req.user.id, req.user.username, "reject_admin_application", userId, 
//     `Rejected admin application from @${app.username}: ${reason}`);
//   res.json({ message: "Application rejected." });
// };


// // ROOM REQUESTS...KILL ME PLS

// const requestSubjectRoom = (req, res) => {
//   const user = userRepo.findById(req.user.id);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const { major, subject } = req.body;
//   if (!major || !subject) return res.status(400).json({ message: "Major and subject are required" });

//   // make sure major belongs to user
//   if (!user.majors?.includes(major)) {
//     return res.status(403).json({ message: "You can only request rooms for your own majors" });
//   }

//   const requests = readRoomRequests();

//   // check for duplicate pending request
//   const duplicate = requests.find(
//     r => r.major === major && 
//     r.subject.toLowerCase() === subject.toLowerCase() && 
//     r.status === "pending"
//   );

//   if (duplicate) {
//     // add user to notifyUsers if not already there
//     if (!duplicate.notifyUsers.includes(req.user.id)) {
//       duplicate.notifyUsers.push(req.user.id);
//       writeRoomRequests(requests);
//     }
//     return res.status(200).json({ 
//       message: "A request for this room is already pending. You'll be notified when it's approved." 
//     });
//   }

//   requests.push({
//     id: Date.now().toString(),
//     userId: req.user.id,
//     username: req.user.username,
//     email: user.email,
//     major,
//     subject,
//     status: "pending",
//     requestedAt: new Date().toISOString(),
//     notifyUsers: [req.user.id] // everyone to notify on approval
//   });

//   writeRoomRequests(requests);
//   res.json({ message: "Room request submitted! You'll be notified when it's reviewed." });
// };

// const getRoomRequests = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
//     return res.status(403).json({ message: "No permission" });
//   }
//   res.json(readRoomRequests().filter(r => r.status === "pending"));
// };

// const handleRoomRequest = async (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
//     return res.status(403).json({ message: "No permission" });
//   }

//   const { requestId, approved, reason } = req.body;
//   const requests = readRoomRequests();
//   const request = requests.find(r => r.id === requestId);
//   if (!request) return res.status(404).json({ message: "Request not found" });

//   request.status = approved ? "approved" : "rejected";
//   writeRoomRequests(requests);

//   if (approved) {
//     // create the room
//     const rooms = roomRepo.getAllRooms();
//     const newRoom = {
//       id: Date.now().toString(),
//       name: request.subject,
//       type: "subject",
//       major: request.major,
//       members: request.notifyUsers,
//       createdAt: new Date().toISOString()
//     };
//     rooms.push(newRoom);
//     roomRepo.writeRooms(rooms);

//     // add room to each notified user
//     request.notifyUsers.forEach(userId => {
//       const u = userRepo.findById(userId);
//       if (u) {
//         userRepo.updateUser(userId, {
//           rooms: [...(u.rooms || []), newRoom.id]
//         });
//       }
//     });

//     // send approval emails to all notifyUsers
//     for (const userId of request.notifyUsers) {
//       const u = userRepo.findById(userId);
//       if (u) {
//         try {
//           await sendRoomRequestApprovedEmail(u.email, u.username, request.subject, request.major);
//         } catch (err) {
//           console.error("Failed to send approval email:", err);
//         }
//       }
//     }

//     addLog(req.user.id, req.user.username, "approve_room_request", requestId,
//       `Approved room "${request.subject}" under ${request.major}`);
//   } else {
//     // rejection email only to original requester
//     try {
//       await sendRoomRequestRejectedEmail(request.email, request.username, request.subject, request.major, reason);
//     } catch (err) {
//       console.error("Failed to send rejection email:", err);
//     }

//     addLog(req.user.id, req.user.username, "reject_room_request", requestId,
//       `Rejected room "${request.subject}" under ${request.major}: ${reason}`);
//   }

//   res.json({ message: approved ? "Room created and users notified." : "Request rejected." });
// };

// //room moderation shit face
// // ROOM MODERATION

// const getRoomsForAdmin = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
//   const rooms = roomRepo.getAllRooms();

//   if (req.user.authorityLevel === "superadmin") {
//     return res.json(rooms);
//   }

//   if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
//     return res.status(403).json({ message: "No permission" });
//   }

//   // only return assigned rooms
//   const assignedRooms = rooms.filter(r => 
//     admin.assignedRooms?.includes(r.id)
//   );
//   res.json(assignedRooms);
// };

// const suspendFromRoom = (req, res) => {
//   const admin = userRepo.findById(req.user.id);
  
//   if (req.user.authorityLevel !== "superadmin") {
//     if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
//       return res.status(403).json({ message: "No permission" });
//     }
//     // check admin is assigned to this room
//     if (!admin.assignedRooms?.includes(req.body.roomId)) {
//       return res.status(403).json({ message: "You are not assigned to this room" });
//     }
//   }

//   const { roomId, userId, days, reason } = req.body;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  
//   roomRepo.suspendMemberFromRoom(roomId, userId, until, reason);

//   // increment room violation count
//   const roomViolations = user.roomViolations || {};
//   roomViolations[roomId] = (roomViolations[roomId] || 0) + 1;
  
//   userRepo.updateUser(userId, {
//     violationCount: (user.violationCount || 0) + 1,
//     roomViolations,
//     actionHistory: [...(user.actionHistory || []), {
//       action: "room_suspended",
//       roomId,
//       by: req.user.username,
//       reason,
//       until,
//       date: new Date().toISOString()
//     }]
//   });

//   addLog(req.user.id, req.user.username, "room_suspend", userId,
//     `Suspended @${user.username} from room ${roomId} for ${days} days: ${reason}`);
//   res.json({ message: `User suspended from room for ${days} days` });
// };

// const unsuspendFromRoom = (req, res) => {
//   const admin = userRepo.findById(req.user.id);

//   if (req.user.authorityLevel !== "superadmin") {
//     if (!hasPermission(admin, PERMISSIONS.MANAGE_ROOMS)) {
//       return res.status(403).json({ message: "No permission" });
//     }
//     if (!admin.assignedRooms?.includes(req.body.roomId)) {
//       return res.status(403).json({ message: "You are not assigned to this room" });
//     }
//   }

//   const { roomId, userId } = req.body;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   roomRepo.unsuspendMemberFromRoom(roomId, userId);

//   userRepo.updateUser(userId, {
//     actionHistory: [...(user.actionHistory || []), {
//       action: "room_unsuspended",
//       roomId,
//       by: req.user.username,
//       date: new Date().toISOString()
//     }]
//   });

//   addLog(req.user.id, req.user.username, "room_unsuspend", userId,
//     `Lifted room suspension for @${user.username} in room ${roomId}`);
//   res.json({ message: "Room suspension lifted" });
// };

// const deleteRoomAdmin = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can delete rooms" });
//   }

//   const { roomId } = req.params;
//   const room = roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: "Room not found" });

//   const rooms = roomRepo.getAllRooms().filter(r => r.id !== roomId);
//   roomRepo.writeRooms(rooms);

//   addLog(req.user.id, req.user.username, "delete_room", roomId,
//     `Deleted room "${room.name}"`);
//   res.json({ message: "Room deleted" });
// };


// const getCurrentAdmins = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can view admins" });
//   }
//   const admins = userRepo.readUsers()
//     .filter(u => u.authorityLevel === "admin")
//     .map(({ password, ...u }) => u);
//   res.json(admins);
// };

// const editAdminPermissions = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can edit permissions" });
//   }
//   const { userId } = req.params;
//   const { permissions, assignedRooms } = req.body;
//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   userRepo.updateUser(userId, {
//     permissions: permissions || [],
//     assignedRooms: assignedRooms || [],
//     actionHistory: [...(user.actionHistory || []), {
//       action: "permissions_edited",
//       by: req.user.username,
//       date: new Date().toISOString()
//     }]
//   });

//   addLog(req.user.id, req.user.username, "edit_admin_permissions", userId,
//     `Updated permissions for @${user.username}: ${permissions?.join(", ")}`);
//   res.json({ message: "Permissions updated" });
// };

// //to override or not to override....quite a question...eh what the hell ,lets just go for it
// const overrideLog = (req, res) => {
//   if (req.user.authorityLevel !== "superadmin") {
//     return res.status(403).json({ message: "Only superadmin can override actions" });
//   }

//   const { logId } = req.params;
//   const { reason } = req.body;

//   if (!reason?.trim()) {
//     return res.status(400).json({ message: "Override reason is required" });
//   }

//   const logs = readLogs();
//   const log = logs.find(l => l.id === logId);
//   if (!log) return res.status(404).json({ message: "Log not found" });
//   if (log.overriddenBy) return res.status(400).json({ message: "This action has already been overridden" });

//   const posts = postRepo.getPostsAll();

//   try {
//     switch (log.action) {

//       case "suspend_user": {
//         const user = userRepo.findById(log.targetId);
//         if (!user) return res.status(404).json({ message: "User not found" });
//         userRepo.updateUser(log.targetId, {
//           suspendedUntil: null,
//           suspensionReason: null,
//           actionHistory: [...(user.actionHistory || []), {
//             action: "suspension_overridden",
//             by: req.user.username,
//             reason,
//             date: new Date().toISOString()
//           }]
//         });
//         break;
//       }

//       case "hide_post": {
//         const post = posts.find(p => p.id === log.targetId);
//         if (!post) return res.status(404).json({ message: "Post not found" });
//         post.isHidden = false;
//         post.autoHidden = false;
//         postRepo.writePosts(posts);
//         break;
//       }

//       case "hide_comment": {
//         // targetId is commentId, need to find which post contains it
//         let found = false;
//         for (const post of posts) {
//           const comment = post.comments?.find(c => c.id === log.targetId);
//           if (comment) {
//             comment.isHidden = false;
//             comment.autoHidden = false;
//             found = true;
//             break;
//           }
//         }
//         if (!found) return res.status(404).json({ message: "Comment not found" });
//         postRepo.writePosts(posts);
//         break;
//       }

//       case "room_suspend": {
//         // details format: "Suspended @username from room ROOMID for X days: reason"
//         // targetId is the userId here
//         const user = userRepo.findById(log.targetId);
//         if (!user) return res.status(404).json({ message: "User not found" });

//         // extract roomId from details string
//         const roomIdMatch = log.details.match(/from room (\S+) for/);
//         if (!roomIdMatch) return res.status(400).json({ message: "Could not parse room ID from log" });
//         const roomId = roomIdMatch[1];

//         roomRepo.unsuspendMemberFromRoom(roomId, log.targetId);
//         userRepo.updateUser(log.targetId, {
//           actionHistory: [...(user.actionHistory || []), {
//             action: "room_suspension_overridden",
//             roomId,
//             by: req.user.username,
//             reason,
//             date: new Date().toISOString()
//           }]
//         });
//         break;
//       }

//       case "approve_resource":
//       case "reject_resource": {
//         const post = posts.find(p => p.id === log.targetId);
//         if (!post) return res.status(404).json({ message: "Post not found" });
//         // flip it
//         post.resourceApproved = log.action === "approve_resource" ? false : null;
//         postRepo.writePosts(posts);
//         break;
//       }

//       default:
//         return res.status(400).json({ message: `Action "${log.action}" is not overridable` });
//     }

//   } catch (err) {
//     console.error("Override error:", err);
//     return res.status(500).json({ message: "Override failed" });
//   }

//   // mark the original log as overridden
//   log.overriddenBy = req.user.username;
//   log.overrideReason = reason;
//   log.overriddenAt = new Date().toISOString();
//   writeLogs(logs);

//   // write a new audit log for the override itself
//   addLog(req.user.id, req.user.username, "override_action", log.targetId,
//     `Overrode "${log.action}" (log #${log.id}): ${reason}`
//   );

//   res.json({ message: "Action overridden successfully" });
// };

// module.exports = {
//   getAllUsers,
//   suspendUser,
//   unsuspendUser,
//   deleteUserAccount,
//   getPendingProfessors,
//   verifyProfessor,
//   rejectProfessor,
//   getReportedContent,
//   hideContent,
//   approveResource,
//   upgradeToAdmin,
//   removeAdmin,
//   upgradToSuperAdmin,
//   getLogs,
//   getStats,
//   getAnnouncements,
//   createAnnouncement,
//   deleteAnnouncement,
//   getAllPostsAdmin,
//   getAllRoomsAdmin,
//   getPendingResources,
//   getOtherInputs,
//   validateOtherInput,
//   restoreContent,
//   getHiddenContent,
//   applyForAdmin,
//   withdrawApplication,
//   getApplications,
//   rejectApplication,
//   requestSubjectRoom,
//   getRoomRequests,
//   handleRoomRequest,
//   getRoomsForAdmin,
//   suspendFromRoom,
//   unsuspendFromRoom,
//   deleteRoomAdmin,
//   getCurrentAdmins,
//   editAdminPermissions,
//   overrideLog,
// };

// //this one is getting humangasoures....this is bad but not so bad...it has all admin shit which is bad...

const userRepo = require('../repositories/user.repo');
const postRepo = require('../repositories/post.repo');
const commentRepo = require('../repositories/comment.repo');
const roomRepo = require('../repositories/room.repo');
const pool = require('../db');
const PERMISSIONS = require('../config/permissions');
const hasPermission = require('../utils/hasPermission');
const toCamel = require('../utils/toCamel');

const {
  sendProfessorRejectionEmail,
  sendProfessorVerificationEmail,
  sendAdminApplicationAcceptedEmail,
  sendAdminApplicationRejectedEmail,
  sendRoomRequestApprovedEmail,
  sendRoomRequestRejectedEmail,
} = require('../config/email');

// --- helpers ---

const addLog = async (adminId, adminUsername, action, targetId, details) => {
  await pool.query(
    `INSERT INTO admin_logs (admin_id, admin_username, action, target_id, details)
     VALUES ($1,$2,$3,$4,$5)`,
    [adminId, adminUsername, action, targetId || null, details || null]
  );
};

const addActionHistory = async (userId, action, performedBy, reason = null, roomId = null) => {
  await pool.query(
    `INSERT INTO action_history (user_id, action, performed_by, reason, room_id)
     VALUES ($1,$2,$3,$4,$5)`,
    [userId, action, performedBy, reason, roomId || null]
  );
};

const getUserPermissions = async (userId) => {
  const result = await pool.query(
    `SELECT permission FROM user_permissions WHERE user_id = $1`,
    [userId]
  );
  return result.rows.map(r => r.permission);
};

// hasPermission now needs to be async since permissions are in DB
const checkPermission = async (userId, authorityLevel, permission) => {
  if (authorityLevel === 'superadmin') return true;
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
};

// --- user management ---

const getAllUsers = async (req, res) => {
  const { q, role, status } = req.query;

  let query = `SELECT id, full_name, username, email, role, authority_level,
                      verification_status, rating, violation_count,
                      suspended_until, suspension_reason, created_at
               FROM users WHERE 1=1`;
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    query += ` AND username ILIKE $${params.length}`;
  }
  if (role) {
    params.push(role);
    query += ` AND role = $${params.length}`;
  }
  if (status === 'suspended') {
    query += ` AND suspended_until IS NOT NULL AND suspended_until > NOW()`;
  }
  if (status === 'pending') {
    query += ` AND verification_status = 'pending'`;
  }

  const result = await pool.query(query, params);
  res.json(result.rows);
};

const suspendUser = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.SUSPEND_USERS);
  if (!allowed) return res.status(403).json({ message: 'No permission to suspend users' });

  const { userId } = req.params;
  const { days, reason } = req.body;

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.authority_level !== 'user') return res.status(403).json({ message: 'Cannot suspend admins' });

  const suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await userRepo.updateUser(userId, {
    suspendedUntil,
    suspensionReason: reason || 'Policy violation',
    violationCount: (user.violation_count || 0) + 1,
  });

  await addActionHistory(userId, 'suspended', req.user.id, reason);
  await addLog(req.user.id, req.user.username, 'suspend_user', userId,
    `Suspended for ${days} days: ${reason}`);

  res.json({ message: `User suspended for ${days} days` });
};

const unsuspendUser = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.SUSPEND_USERS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, {
    suspendedUntil: null,
    suspensionReason: null,
  });

  await addActionHistory(userId, 'unsuspended', req.user.id);
  await addLog(req.user.id, req.user.username, 'unsuspend_user', userId, 'Suspension lifted');

  res.json({ message: 'User unsuspended' });
};

const deleteUserAccount = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can delete accounts' });
  }

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.deleteUser(userId);
  await addLog(req.user.id, req.user.username, 'delete_account', userId,
    `Deleted account @${user.username}`);

  res.json({ message: 'Account deleted' });
};

// --- professor verification ---

const getPendingProfessors = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VERIFY_PROFESSORS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(
    `SELECT id, full_name, username, email, role, verification_status, proof_file_url, created_at
     FROM users WHERE verification_status = 'pending'`
  );
  res.json(result.rows);
};

const verifyProfessor = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VERIFY_PROFESSORS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, { verificationStatus: 'verified' });
  await addActionHistory(userId, 'professor_verified', req.user.id);
  await addLog(req.user.id, req.user.username, 'verify_professor', userId,
    `Verified @${user.username} as professor`);

  try {
    await sendProfessorVerificationEmail(user.email, user.username);
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  res.json({ message: 'Professor verified' });
};

const rejectProfessor = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VERIFY_PROFESSORS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { userId } = req.params;
  const { reason } = req.body;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // check if user has more than 1 major — if so, flag for reorientation
  const majorsResult = await pool.query(
    `SELECT COUNT(*) FROM user_majors WHERE user_id = $1`,
    [userId]
  );
  const majorCount = parseInt(majorsResult.rows[0].count);

  await userRepo.updateUser(userId, {
    role: 'student',
    verificationStatus: 'rejected',
    pendingReorientation: majorCount > 1,
  });

  await addActionHistory(userId, 'professor_rejected', req.user.id, reason);
  await addLog(req.user.id, req.user.username, 'reject_professor', userId,
    `Rejected @${user.username}: ${reason}`);

  try {
    await sendProfessorRejectionEmail(user.email, user.username, reason);
  } catch (err) {
    console.error('Failed to send rejection email:', err);
  }

  res.json({ message: 'Professor rejected and demoted to student' });
};

// --- content moderation ---

const getReportedContent = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.HANDLE_REPORTS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const postsResult = await pool.query(
    `SELECT p.*, COUNT(r.id) as report_count
     FROM posts p
     JOIN reports r ON r.post_id = p.id
     GROUP BY p.id
     HAVING COUNT(r.id) > 0
     ORDER BY report_count DESC`
  );

  const commentsResult = await pool.query(
    `SELECT c.*, p.title as post_title, p.id as parent_post_id, COUNT(r.id) as report_count
     FROM comments c
     JOIN reports r ON r.comment_id = c.id
     JOIN posts p ON p.id = c.post_id
     GROUP BY c.id, p.title, p.id
     HAVING COUNT(r.id) > 0
     ORDER BY report_count DESC`
  );

  res.json({
    posts: postsResult.rows,
    comments: commentsResult.rows,
  });
};

const hideContent = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MODERATE_CONTENT);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { type, postId, commentId } = req.body;

  if (type === 'post') {
    const post = await postRepo.getPostById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await postRepo.hidePost(postId);
    await addLog(req.user.id, req.user.username, 'hide_post', postId, 'Post hidden by admin');

  } else if (type === 'comment') {
    const comment = await commentRepo.getCommentById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    await commentRepo.hideComment(commentId);
    await addLog(req.user.id, req.user.username, 'hide_comment', commentId, 'Comment hidden by admin');
  }

  res.json({ message: 'Content hidden' });
};

const restoreContent = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MODERATE_CONTENT);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { type, postId, commentId } = req.body;

  if (type === 'post') {
    const post = await postRepo.getPostById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await postRepo.unhidePost(postId);
    await addLog(req.user.id, req.user.username, 'restore_post', postId, 'Post restored');

  } else if (type === 'comment') {
    const comment = await commentRepo.getCommentById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    await commentRepo.unhideComment(commentId);
    await addLog(req.user.id, req.user.username, 'restore_comment', commentId, 'Comment restored');
  }

  res.json({ message: 'Content restored' });
};

const getHiddenContent = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MODERATE_CONTENT);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const postsResult = await pool.query(
    `SELECT * FROM posts WHERE is_hidden = true ORDER BY updated_at DESC`
  );

  const commentsResult = await pool.query(
    `SELECT c.*, p.title as post_title FROM comments c
     JOIN posts p ON p.id = c.post_id
     WHERE c.is_hidden = true
     ORDER BY c.updated_at DESC`
  );

  res.json({
    posts: postsResult.rows,
    comments: commentsResult.rows,
  });
};

const getPendingResources = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.APPROVE_RESOURCES);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(
    `SELECT * FROM posts
     WHERE resource_approved IS NULL
     AND (pdf_url IS NOT NULL OR image_url IS NOT NULL OR resource_link IS NOT NULL)
     ORDER BY created_at DESC`
  );

  res.json(result.rows);
};

const approveResource = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.APPROVE_RESOURCES);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { postId, approved } = req.body;
  const post = await postRepo.getPostById(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  await postRepo.approveResource(postId, approved);
  await addLog(req.user.id, req.user.username,
    approved ? 'approve_resource' : 'reject_resource',
    postId,
    `Resource ${approved ? 'approved' : 'rejected'}`
  );

  res.json({ message: `Resource ${approved ? 'approved' : 'rejected'}` });
};

const getOtherInputs = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VALIDATE_OTHER);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  // users whose university or majors are not in the default seeded data
  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.university_code, u.university_name,
            u.other_input_status,
            array_agg(m.name) as majors
     FROM users u
     LEFT JOIN user_majors um ON um.user_id = u.id
     LEFT JOIN majors m ON m.id = um.major_id
     WHERE u.other_input_status = 'pending'
        OR u.university_code NOT IN (SELECT code FROM universities)
     GROUP BY u.id`
  );

  res.json(result.rows);
};

const validateOtherInput = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.VALIDATE_OTHER);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { userId, approved } = req.body;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, {
    otherInputStatus: approved ? 'approved' : 'rejected',
  });

  await addActionHistory(userId,
    approved ? 'other_input_approved' : 'other_input_rejected',
    req.user.id
  );

  await addLog(req.user.id, req.user.username,
    approved ? 'approve_other_input' : 'reject_other_input',
    userId,
    `Custom input ${approved ? 'approved' : 'rejected'} for @${user.username}`
  );

  res.json({ message: `Input ${approved ? 'approved' : 'rejected'}` });
};

// --- superadmin ---

const getLogs = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can view logs' });
  }

  const result = await pool.query(
    `SELECT * FROM admin_logs ORDER BY created_at DESC`
  );
  res.json(result.rows);
};

const getStats = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can view stats' });
  }

  const [users, posts, comments, rooms, suspended, pendingProfs, reportedPosts, reportedComments] =
    await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM posts`),
      pool.query(`SELECT COUNT(*) FROM comments`),
      pool.query(`SELECT COUNT(*) FROM rooms`),
      pool.query(`SELECT COUNT(*) FROM users WHERE suspended_until IS NOT NULL AND suspended_until > NOW()`),
      pool.query(`SELECT COUNT(*) FROM users WHERE verification_status = 'pending'`),
      pool.query(`SELECT COUNT(DISTINCT post_id) FROM reports WHERE post_id IS NOT NULL`),
      pool.query(`SELECT COUNT(DISTINCT comment_id) FROM reports WHERE comment_id IS NOT NULL`),
    ]);

  res.json({
    totalUsers:        parseInt(users.rows[0].count),
    totalPosts:        parseInt(posts.rows[0].count),
    totalComments:     parseInt(comments.rows[0].count),
    totalRooms:        parseInt(rooms.rows[0].count),
    suspendedUsers:    parseInt(suspended.rows[0].count),
    pendingProfessors: parseInt(pendingProfs.rows[0].count),
    reportedContent:   parseInt(reportedPosts.rows[0].count) + parseInt(reportedComments.rows[0].count),
  });
};

const getAnnouncements = async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, u.username as created_by_username 
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     ORDER BY a.created_at DESC`
  );
  res.json(result.rows);
};

const createAnnouncement = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can create announcements' });
  }

  const { message } = req.body;
  const result = await pool.query(
    `INSERT INTO announcements (message, created_by) VALUES ($1,$2) RETURNING *`,
    [message, req.user.id]
  );

  await addLog(req.user.id, req.user.username, 'create_announcement', null, message);
  res.status(201).json(result.rows[0]);
};

const deleteAnnouncement = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can delete announcements' });
  }

  const { id } = req.params;
  await pool.query(`DELETE FROM announcements WHERE id = $1`, [id]);
  res.json({ message: 'Announcement deleted' });
};

const getAllPostsAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'No permission' });
  }
  const result = await pool.query(`SELECT * FROM posts ORDER BY created_at DESC`);
  res.json(result.rows);
};

const getAllRoomsAdmin = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(`SELECT * FROM rooms ORDER BY created_at DESC`);
  res.json(result.rows);
};

const upgradeToAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can upgrade users' });
  }

  const { userId } = req.params;
  const { permissions = [], assignedRooms = [] } = req.body;

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, { authorityLevel: 'admin' });

  // insert permissions
  for (const permission of permissions) {
    await pool.query(
      `INSERT INTO user_permissions (user_id, permission) VALUES ($1,$2)
       ON CONFLICT (user_id, permission) DO NOTHING`,
      [userId, permission]
    );
  }

  // insert assigned rooms
  for (const roomId of assignedRooms) {
    await pool.query(
      `INSERT INTO admin_assigned_rooms (user_id, room_id) VALUES ($1,$2)
       ON CONFLICT (user_id, room_id) DO NOTHING`,
      [userId, roomId]
    );
  }

  // remove application
  await pool.query(`DELETE FROM admin_applications WHERE user_id = $1`, [userId]);

  await addActionHistory(userId, 'upgraded_to_admin', req.user.id);
  await addLog(req.user.id, req.user.username, 'upgrade_to_admin', userId,
    `Upgraded @${user.username} to admin`);

  try {
    await sendAdminApplicationAcceptedEmail(user.email, user.username);
  } catch (err) {
    console.error('Failed to send acceptance email:', err);
  }

  res.json({ message: 'User upgraded to admin' });
};

const removeAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can remove admins' });
  }

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, { authorityLevel: 'user' });

  // remove all permissions and assigned rooms
  await pool.query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM admin_assigned_rooms WHERE user_id = $1`, [userId]);

  await addActionHistory(userId, 'admin_removed', req.user.id);
  await addLog(req.user.id, req.user.username, 'remove_admin', userId,
    `Removed admin from @${user.username}`);

  res.json({ message: 'Admin removed' });
};

const upgradToSuperAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can add superadmins' });
  }

  const { userId } = req.params;
  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await userRepo.updateUser(userId, { authorityLevel: 'superadmin' });

  // superadmins don't need permissions rows
  await pool.query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);

  await addActionHistory(userId, 'upgraded_to_superadmin', req.user.id);
  await addLog(req.user.id, req.user.username, 'upgrade_to_superadmin', userId,
    `Upgraded @${user.username} to superadmin`);

  res.json({ message: 'User upgraded to superadmin' });
};

const getCurrentAdmins = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can view admins' });
  }

  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.rating, u.authority_level,
            array_agg(DISTINCT up.permission) FILTER (WHERE up.permission IS NOT NULL) as permissions,
            array_agg(DISTINCT aar.room_id) FILTER (WHERE aar.room_id IS NOT NULL) as assigned_rooms
     FROM users u
     LEFT JOIN user_permissions up ON up.user_id = u.id
     LEFT JOIN admin_assigned_rooms aar ON aar.user_id = u.id
     WHERE u.authority_level = 'admin'
     GROUP BY u.id`
  );
  res.json(result.rows);
};

const editAdminPermissions = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can edit permissions' });
  }

  const { userId } = req.params;
  const { permissions = [], assignedRooms = [] } = req.body;

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // replace permissions — delete all then reinsert
  await pool.query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);
  for (const permission of permissions) {
    await pool.query(
      `INSERT INTO user_permissions (user_id, permission) VALUES ($1,$2)`,
      [userId, permission]
    );
  }

  // replace assigned rooms
  await pool.query(`DELETE FROM admin_assigned_rooms WHERE user_id = $1`, [userId]);
  for (const roomId of assignedRooms) {
    await pool.query(
      `INSERT INTO admin_assigned_rooms (user_id, room_id) VALUES ($1,$2)`,
      [userId, roomId]
    );
  }

  await addActionHistory(userId, 'permissions_edited', req.user.id);
  await addLog(req.user.id, req.user.username, 'edit_admin_permissions', userId,
    `Updated permissions for @${user.username}: ${permissions.join(', ')}`);

  res.json({ message: 'Permissions updated' });
};

// --- admin applications ---

const applyForAdmin = async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (parseFloat(user.rating) < 3.5) {
    return res.status(403).json({ message: 'Rating too low to apply' });
  }

  if (user.authority_level !== 'user') {
    return res.status(400).json({ message: 'Already an admin' });
  }

  try {
    await pool.query(
      `INSERT INTO admin_applications (user_id, username, email, rating)
       VALUES ($1,$2,$3,$4)`,
      [user.id, user.username, user.email, user.rating]
    );
    res.json({ message: 'Application submitted!' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'You already have a pending application' });
    }
    throw err;
  }
};

const withdrawApplication = async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM admin_applications WHERE user_id = $1`,
    [req.user.id]
  );
  const app = result.rows[0];
  if (!app) return res.status(404).json({ message: 'No application found' });

  const hoursSince = (Date.now() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60);
  if (hoursSince > 2) {
    return res.status(403).json({
      message: 'Withdrawal window has passed. Please contact a superadmin to remove your application.'
    });
  }

  await pool.query(`DELETE FROM admin_applications WHERE user_id = $1`, [req.user.id]);
  res.json({ message: 'Application withdrawn.' });
};

const getApplications = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can view applications' });
  }

  const result = await pool.query(
    `SELECT * FROM admin_applications ORDER BY applied_at DESC`
  );
  res.json(result.rows);
};

const rejectApplication = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can reject applications' });
  }

  const { userId, reason } = req.body;

  const result = await pool.query(
    `SELECT * FROM admin_applications WHERE user_id = $1`,
    [userId]
  );
  const app = result.rows[0];
  if (!app) return res.status(404).json({ message: 'Application not found' });

  await pool.query(`DELETE FROM admin_applications WHERE user_id = $1`, [userId]);

  const user = await userRepo.findById(userId);
  await addLog(req.user.id, req.user.username, 'reject_admin_application', userId,
    `Rejected admin application from @${app.username}: ${reason}`);

  try {
    await sendAdminApplicationRejectedEmail(user.email, user.username, reason);
  } catch (err) {
    console.error('Failed to send rejection email:', err);
  }

  res.json({ message: 'Application rejected.' });
};

// --- room requests ---

const requestSubjectRoom = async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { majorId, subject } = req.body;
  if (!majorId || !subject) return res.status(400).json({ message: 'Major and subject are required' });

  // verify user is enrolled in this major
  const majorCheck = await pool.query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1 AND um.major_id = $2`,
    [req.user.id, majorId]
  );
  if (majorCheck.rows.length === 0) {
    return res.status(403).json({ message: 'You can only request rooms for your own majors' });
  }
  const majorName = majorCheck.rows[0].name;

  // check for duplicate pending request
  const duplicate = await pool.query(
    `SELECT * FROM room_requests
     WHERE major = $1 AND LOWER(subject) = LOWER($2) AND status = 'pending'`,
    [majorName, subject]
  );

  if (duplicate.rows.length > 0) {
    const existingRequest = duplicate.rows[0];
    // add user to notify list if not already there
    await pool.query(
      `INSERT INTO room_request_notify (request_id, user_id, email)
       VALUES ($1,$2,$3)
       ON CONFLICT (request_id, user_id) DO NOTHING`,
      [existingRequest.id, req.user.id, user.email]
    );
    return res.status(200).json({
      message: "A request for this room is already pending. You'll be notified when it's approved."
    });
  }

  // create new request
  const newRequest = await pool.query(
    `INSERT INTO room_requests (requested_by, major, subject, email, username)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.id, majorName, subject, user.email, user.username]
  );

  // add requester to notify list
  await pool.query(
    `INSERT INTO room_request_notify (request_id, user_id, email)
     VALUES ($1,$2,$3)`,
    [newRequest.rows[0].id, req.user.id, user.email]
  );

  res.json({ message: "Room request submitted! You'll be notified when it's reviewed." });
};

const getRoomRequests = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(
    `SELECT * FROM room_requests WHERE status = 'pending' ORDER BY requested_at DESC`
  );
  res.json(result.rows);
};

const handleRoomRequest = async (req, res) => {
  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const { requestId, approved, reason } = req.body;

  const requestResult = await pool.query(
    `SELECT * FROM room_requests WHERE id = $1`,
    [requestId]
  );
  const request = requestResult.rows[0];
  if (!request) return res.status(404).json({ message: 'Request not found' });

  await pool.query(
    `UPDATE room_requests SET status = $1 WHERE id = $2`,
    [approved ? 'approved' : 'rejected', requestId]
  );

  if (approved) {
    // get major_id
    const majorResult = await pool.query(
      `SELECT id FROM majors WHERE name = $1`,
      [request.major]
    );
    const majorId = majorResult.rows[0]?.id || null;

    // create the room
    const room = await roomRepo.createRoom({
      name: request.subject,
      type: 'subject',
      majorId,
      createdBy: null,
    });

    // get all notify users
    const notifyUsers = await pool.query(
      `SELECT user_id, email FROM room_request_notify WHERE request_id = $1`,
      [requestId]
    );

    // add each as member and send email
    for (const { user_id, email } of notifyUsers.rows) {
      await roomRepo.addMember(room.id, user_id);
      const u = await userRepo.findById(user_id);
      if (u) {
        try {
          await sendRoomRequestApprovedEmail(email, u.username, request.subject, request.major);
        } catch (err) {
          console.error('Failed to send approval email:', err);
        }
      }
    }

    await addLog(req.user.id, req.user.username, 'approve_room_request', requestId,
      `Approved room "${request.subject}" under ${request.major}`);

  } else {
    try {
      await sendRoomRequestRejectedEmail(
        request.email, request.username, request.subject, request.major, reason
      );
    } catch (err) {
      console.error('Failed to send rejection email:', err);
    }

    await addLog(req.user.id, req.user.username, 'reject_room_request', requestId,
      `Rejected room "${request.subject}" under ${request.major}: ${reason}`);
  }

  res.json({ message: approved ? 'Room created and users notified.' : 'Request rejected.' });
};

// --- room moderation ---

const getRoomsForAdmin = async (req, res) => {
  if (req.user.authorityLevel === 'superadmin') {
    const result = await pool.query(`SELECT * FROM rooms ORDER BY created_at DESC`);
    return res.json(result.rows);
  }

  const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
  if (!allowed) return res.status(403).json({ message: 'No permission' });

  const result = await pool.query(
    `SELECT r.* FROM rooms r
     JOIN admin_assigned_rooms aar ON aar.room_id = r.id
     WHERE aar.user_id = $1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
};

const suspendFromRoom = async (req, res) => {
  const { roomId, userId, days, reason } = req.body;

  if (req.user.authorityLevel !== 'superadmin') {
    const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
    if (!allowed) return res.status(403).json({ message: 'No permission' });

    const assignedCheck = await pool.query(
      `SELECT 1 FROM admin_assigned_rooms WHERE user_id = $1 AND room_id = $2`,
      [req.user.id, roomId]
    );
    if (assignedCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to this room' });
    }
  }

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await roomRepo.suspendMemberFromRoom(roomId, userId, until, reason);

  await userRepo.updateUser(userId, {
    violationCount: (user.violation_count || 0) + 1,
  });

  await addActionHistory(userId, 'room_suspended', req.user.id, reason, roomId);
  await addLog(req.user.id, req.user.username, 'room_suspend', userId,
    `Suspended @${user.username} from room ${roomId} for ${days} days: ${reason}`);

  res.json({ message: `User suspended from room for ${days} days` });
};

const unsuspendFromRoom = async (req, res) => {
  const { roomId, userId } = req.body;

  if (req.user.authorityLevel !== 'superadmin') {
    const allowed = await checkPermission(req.user.id, req.user.authorityLevel, PERMISSIONS.MANAGE_ROOMS);
    if (!allowed) return res.status(403).json({ message: 'No permission' });

    const assignedCheck = await pool.query(
      `SELECT 1 FROM admin_assigned_rooms WHERE user_id = $1 AND room_id = $2`,
      [req.user.id, roomId]
    );
    if (assignedCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to this room' });
    }
  }

  const user = await userRepo.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await roomRepo.unsuspendMemberFromRoom(roomId, userId);
  await addActionHistory(userId, 'room_unsuspended', req.user.id, null, roomId);
  await addLog(req.user.id, req.user.username, 'room_unsuspend', userId,
    `Lifted room suspension for @${user.username} in room ${roomId}`);

  res.json({ message: 'Room suspension lifted' });
};

const deleteRoomAdmin = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can delete rooms' });
  }

  const { roomId } = req.params;
  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  await pool.query(`DELETE FROM rooms WHERE id = $1`, [roomId]);
  await addLog(req.user.id, req.user.username, 'delete_room', roomId,
    `Deleted room "${room.name}"`);

  res.json({ message: 'Room deleted' });
};

// --- override ---

const overrideLog = async (req, res) => {
  if (req.user.authorityLevel !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can override actions' });
  }

  const { logId } = req.params;
  const { reason } = req.body;

  if (!reason?.trim()) return res.status(400).json({ message: 'Override reason is required' });

  const logResult = await pool.query(`SELECT * FROM admin_logs WHERE id = $1`, [logId]);
  const log = logResult.rows[0];
  if (!log) return res.status(404).json({ message: 'Log not found' });
  if (log.overridden_by) return res.status(400).json({ message: 'This action has already been overridden' });

  try {
    switch (log.action) {

      case 'suspend_user': {
        const user = await userRepo.findById(log.target_id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await userRepo.updateUser(log.target_id, {
          suspendedUntil: null,
          suspensionReason: null,
        });
        await addActionHistory(log.target_id, 'suspension_overridden', req.user.id, reason);
        break;
      }

      case 'hide_post': {
        const post = await postRepo.getPostById(log.target_id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        await postRepo.unhidePost(log.target_id);
        break;
      }

      case 'hide_comment': {
        const comment = await commentRepo.getCommentById(log.target_id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        await commentRepo.unhideComment(log.target_id);
        break;
      }

      case 'room_suspend': {
        const user = await userRepo.findById(log.target_id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // extract roomId from details string
        const roomIdMatch = log.details.match(/from room (\S+) for/);
        if (!roomIdMatch) return res.status(400).json({ message: 'Could not parse room ID from log' });

        await roomRepo.unsuspendMemberFromRoom(roomIdMatch[1], log.target_id);
        await addActionHistory(log.target_id, 'room_suspension_overridden', req.user.id, reason, roomIdMatch[1]);
        break;
      }

      case 'approve_resource':
      case 'reject_resource': {
        const post = await postRepo.getPostById(log.target_id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        await postRepo.approveResource(log.target_id, log.action === 'approve_resource' ? false : null);
        break;
      }

      default:
        return res.status(400).json({ message: `Action "${log.action}" is not overridable` });
    }

  } catch (err) {
    console.error('Override error:', err);
    return res.status(500).json({ message: 'Override failed' });
  }

  // mark log as overridden — add columns if not there yet
  await pool.query(
    `UPDATE admin_logs SET
       overridden_by = $1,
       override_reason = $2,
       overridden_at = NOW()
     WHERE id = $3`,
    [req.user.username, reason, logId]
  );

  await addLog(req.user.id, req.user.username, 'override_action', log.target_id,
    `Overrode "${log.action}" (log #${log.id}): ${reason}`);

  res.json({ message: 'Action overridden successfully' });
};


const getAllCommentsAdmin = async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, p.title as post_title 
     FROM comments c
     LEFT JOIN posts p ON p.id = c.post_id
     ORDER BY c.created_at DESC`
  );
  res.json(toCamel(result.rows));
};

// --- exports ---

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
  restoreContent,
  getHiddenContent,
  getPendingResources,
  approveResource,
  getOtherInputs,
  validateOtherInput,
  getLogs,
  getStats,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAllPostsAdmin,
  getAllRoomsAdmin,
  upgradeToAdmin,
  removeAdmin,
  upgradToSuperAdmin,
  getCurrentAdmins,
  editAdminPermissions,
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
  overrideLog,
  getAllCommentsAdmin,
};