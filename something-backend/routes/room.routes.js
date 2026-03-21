const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const protect = require("../middleware/authMiddleware");
const { guestBlock } = require("../middleware/authMiddleware");




router.get("/my-rooms", protect, roomController.getMyRooms);
router.get("/public-rooms", roomController.getPublicRooms);

//private rooms require ALOT
router.post("/private", protect, guestBlock, roomController.createPrivateRoom);
router.post("/private/join", protect, guestBlock, roomController.joinPrivateRoom);
router.delete("/private/:roomId", protect, guestBlock, roomController.deletePrivateRoom);
router.patch("/private/:roomId/rename", protect, guestBlock, roomController.renamePrivateRoom);
router.patch("/private/:roomId/admin/:memberId", protect, guestBlock, roomController.upgradeToAdmin);
router.get("/:roomId", protect, roomController.getRoomById);

router.get("/:roomId/members", protect, roomController.getRoomMembers);

module.exports = router;