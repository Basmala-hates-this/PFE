const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, postController.createPost);
router.get("/", protect, postController.getPostsAll);
router.get("/:id", protect, postController.getPostById);
router.patch("/:id/vote", protect, postController.votePost);
router.patch("/:id", protect, postController.updatePost);
router.delete("/:id", protect, postController.deletePost);
router.post("/:postId/comments", protect, postController.addComment);
router.delete("/:postId/comments/:commentId", protect, postController.deleteComment);
router.patch("/:postId/comments/:commentId/vote", protect, postController.voteComment);


module.exports = router;