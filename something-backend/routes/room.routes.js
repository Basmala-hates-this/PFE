const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const protect = require("../middleware/authMiddleware");
const { guestBlock } = require("../middleware/authMiddleware");
const adminController= require("../controllers/admin.controller")




router.get("/my-rooms", protect, roomController.getMyRooms);
router.get("/public-rooms", roomController.getPublicRooms);
router.delete('/private/:roomId/members/:memberId', protect, guestBlock, roomController.kickMember);
router.post('/private/:roomId/invite', protect, guestBlock, roomController.inviteMember);

//private rooms require ALOT
router.post("/private", protect, guestBlock, roomController.createPrivateRoom);
router.post("/private/join", protect, guestBlock, roomController.joinPrivateRoom);

router.get("/subject-rooms", protect, roomController.getSubjectRoomsForUser);
router.post("/subject-rooms/:roomId/join", protect, guestBlock, roomController.joinSubjectRoom);
router.delete("/subject-rooms/:roomId/leave", protect, guestBlock, roomController.leaveSubjectRoom);


router.post("/subject-rooms/create", protect, guestBlock, roomController.createSubjectRoom);

//subejct room request
router.post("/subject-rooms/request", protect, adminController.requestSubjectRoom);


router.delete("/private/:roomId", protect, guestBlock, roomController.deletePrivateRoom);
router.patch("/private/:roomId/rename", protect, guestBlock, roomController.renamePrivateRoom);
router.patch("/private/:roomId/admin/:memberId", protect, guestBlock, roomController.upgradeToAdmin);
router.get("/:roomId", protect, roomController.getRoomById);

router.get("/:roomId/members", protect, roomController.getRoomMembers);
router.delete("/:roomId/leave", protect, guestBlock, roomController.leaveRoom);

module.exports = router;