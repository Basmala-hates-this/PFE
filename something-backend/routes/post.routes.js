const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, postController.createPost);
router.get("/", protect, postController.getPostsAll);
router.get("/:id", protect, postController.getPostById);
router.patch("/:id/vote", protect, postController.votePost);


module.exports = router;