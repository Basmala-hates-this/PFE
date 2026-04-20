const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const protect = require("../middleware/authMiddleware");

//  middleware to check admin or superadmin 
const adminOnly = (req, res, next) => {
  const level = req.user.authorityLevel;
  if (level !== "admin" && level !== "superadmin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// user management 
router.get("/users", protect, adminOnly, adminController.getAllUsers);


router.get("/posts", protect, adminOnly, adminController.getAllPostsAdmin);
router.get("/rooms", protect, adminOnly, adminController.getAllRoomsAdmin);


router.get("/resources/pending", protect, adminOnly, adminController.getPendingResources);
router.get("/content/hidden", protect, adminOnly, adminController.getHiddenContent);
router.patch("/content/restore", protect, adminOnly, adminController.restoreContent);
router.get("/other-inputs", protect, adminOnly, adminController.getOtherInputs);
router.patch("/other-inputs/validate", protect, adminOnly, adminController.validateOtherInput);




router.patch("/users/:userId/suspend", protect, adminOnly, adminController.suspendUser);
router.patch("/users/:userId/unsuspend", protect, adminOnly, adminController.unsuspendUser);
router.delete("/users/:userId", protect, adminController.deleteUserAccount);

// professor verification
router.get("/professors/pending", protect, adminOnly, adminController.getPendingProfessors);
router.patch("/professors/:userId/verify", protect, adminOnly, adminController.verifyProfessor);
router.patch("/professors/:userId/reject", protect, adminOnly, adminController.rejectProfessor);

// \ content moderation 
router.get("/reports", protect, adminOnly, adminController.getReportedContent);
router.patch("/content/hide", protect, adminOnly, adminController.hideContent);
router.patch("/content/resource", protect, adminOnly, adminController.approveResource);

// superadmin only 
router.patch("/users/:userId/upgrade-admin", protect, adminController.upgradeToAdmin);
router.patch("/users/:userId/remove-admin", protect, adminController.removeAdmin);
router.patch("/users/:userId/upgrade-superadmin", protect, adminController.upgradToSuperAdmin);
router.get("/logs", protect, adminController.getLogs);
router.post("/logs/:logId/override", protect, adminController.overrideLog);
router.get("/stats", protect, adminController.getStats);

router.get("/comments", protect,  adminController.getAllCommentsAdmin);

//admin aplicats
router.post("/apply", protect, adminController.applyForAdmin);
router.delete("/apply", protect, adminController.withdrawApplication);
router.get("/applications", protect, adminController.getApplications);
router.post("/applications/reject", protect, adminController.rejectApplication);


// announcements 
router.get("/announcements", adminController.getAnnouncements);
router.post("/announcements", protect, adminController.createAnnouncement);
router.delete("/announcements/:id", protect, adminController.deleteAnnouncement);

//subject room request
router.post("/room-requests", protect, adminController.getRoomRequests);
router.get("/room-requests", protect, adminController.getRoomRequests);
router.post("/room-requests/handle", protect, adminController.handleRoomRequest);

//room mod things ...........not gonna comment
router.get("/rooms-moderation", protect, adminController.getRoomsForAdmin);
router.patch("/rooms-moderation/suspend", protect, adminController.suspendFromRoom);
router.patch("/rooms-moderation/unsuspend", protect, adminController.unsuspendFromRoom);
router.delete("/rooms-moderation/:roomId", protect, adminController.deleteRoomAdmin);

//thigs i forgot about sup....wont add that damn share and report private room...cry me a river

router.get("/admins", protect, adminController.getCurrentAdmins);
router.patch("/users/:userId/edit-permissions", protect, adminController.editAdminPermissions);


module.exports = router;