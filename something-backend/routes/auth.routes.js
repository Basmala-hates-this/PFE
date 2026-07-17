const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const upload = require("../middleware/upload");

router.post("/register", upload.single("proofFile"), authController.register);
router.post("/login", authController.login);

const protect = require("../middleware/authMiddleware");

router.get("/check-email", authController.checkEmail);
router.get("/check-username", authController.checkUsername);

router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);


router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.post("/reset-password-auth", protect, authController.resetPasswordAuth);


router.post("/guest", authController.guestLogin);

router.get("/universities", authController.getApprovedUniversities);
router.get("/majors", authController.getApprovedMajors); 

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;