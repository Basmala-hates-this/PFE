


const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");




router.get("/me/stats", protect, userController.getMyStats);



router.patch("/me", protect, upload.single("profilePic"), userController.updateMe);
router.get("/me", protect, userController.getMe);
router.delete("/me", protect, userController.deleteMe);



module.exports = router;