//minimale placeholder for lunching
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);

const protect = require("../middleware/authMiddleware");

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});
router.get("/check-email", authController.checkEmail);
router.get("/check-username", authController.checkUsername);

module.exports = router;