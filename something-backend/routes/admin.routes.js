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
router.get("/stats", protect, adminController.getStats);

// announcements 
router.get("/announcements", adminController.getAnnouncements);
router.post("/announcements", protect, adminController.createAnnouncement);
router.delete("/announcements/:id", protect, adminController.deleteAnnouncement);

module.exports = router;