


const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");




router.get("/me/stats", protect, userController.getMyStats);



router.patch("/me", protect, upload.single("profilePic"), userController.updateMe);
router.get("/me", protect, userController.getMe);
router.delete("/me", protect, userController.deleteMe);

router.get("/search", protect, userController.searchUsers);


router.get("/:userId", protect, userController.getUserById);
router.get("/:userId/stats", protect, userController.getStatsByUserId);



module.exports = router;