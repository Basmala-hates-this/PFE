
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {guestBlock}=require("../middleware/authMiddleware")



router.get("/me/stats", protect, userController.getMyStats);
router.patch("/me", protect, upload.single("profilePic"), userController.updateMe);
router.get("/me", protect, userController.getMe);
router.delete("/me", protect, userController.deleteMe);
router.get("/search", protect, userController.searchUsers);


router.post("/select-major", protect, userController.selectMajorAfterRejection);
router.post("/select-valid-inputs", protect, userController.selectValidInputs);

//for stat cards
router.get("/me/received-votes", protect, userController.getMyReceivedVotes);
router.get("/me/comments", protect, userController.getMyComments);

router.get('/me/majors', protect, userController.getMyMajors);

router.get('/me/application', protect, userController.getMyApplication);

router.get('/me/permissions', protect, userController.getMyPermissions);

// follow routes BEFORE /:userId
router.post("/:userId/follow", protect, userController.followUser);
router.delete("/:userId/unfollow", protect, userController.unfollowUser);
router.get("/:userId/followers", protect, userController.getFollowers);
router.get("/:userId/following", protect, userController.getFollowing);

router.post("/:userId/report", protect, guestBlock, userController.reportUser);


router.get("/:userId/stats", protect, userController.getStatsByUserId);


router.get("/:userId/majors", protect, userController.getUserMajors);


// these must be last
router.get("/:userId", protect, userController.getUserById);



module.exports = router;