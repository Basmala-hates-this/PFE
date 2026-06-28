const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getNotifications, markRead, markAllRead } = require("../controllers/notificationController");

router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllRead);  // this must come BEFORE /:id/read
router.patch('/:id/read', protect, markRead);

module.exports = router;