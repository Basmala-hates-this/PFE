const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const protect = require("../middleware/authMiddleware");
const { guestBlock } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/:roomId/messages", protect, guestBlock, messageController.getMessages);
router.post("/:roomId/messages", protect, guestBlock, upload.single("attachment"), messageController.sendMessage);
router.delete("/messages/:messageId", protect, guestBlock, messageController.deleteMessage);
router.patch("/messages/:messageId", protect, guestBlock, messageController.editMessage);

module.exports = router;