const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const protect = require("../middleware/authMiddleware");



router.get("/my-rooms", protect, roomController.getMyRooms);
router.get("/public-rooms", roomController.getPublicRooms);

module.exports = router;