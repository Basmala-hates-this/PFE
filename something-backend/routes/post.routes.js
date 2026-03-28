const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const protect = require("../middleware/authMiddleware");
const { guestBlock } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/", protect, guestBlock, upload.single("attachment"), postController.createPost);
router.get("/",  postController.getPostsAll);
router.get("/search", postController.searchPosts);//something to keep in mind,all routes should come befre IDs because things will break and u wont knw why.....


router.post("/:postId/save", protect, guestBlock, postController.savePost);
router.delete("/:postId/save", protect, guestBlock, postController.unsavePost);
router.get("/saved", protect, postController.getSavedPosts);

router.get("/user/:userId", protect, postController.getPostsByUser);


router.get("/:id", protect,postController.getPostById);
router.patch("/:id/vote", protect,guestBlock, postController.votePost);
router.patch("/:id", protect,guestBlock, postController.updatePost);
router.delete("/:id", protect,guestBlock, postController.deletePost);
router.post("/:postId/comments", protect, guestBlock, upload.single("attachment"), postController.addComment);router.delete("/:postId/comments/:commentId", protect,guestBlock, postController.deleteComment);
router.patch("/:postId/comments/:commentId/vote", protect,guestBlock, postController.voteComment);
router.patch("/:postId/comments/:commentId", protect,guestBlock, postController.updateComment);


router.post("/:postId/report", protect, guestBlock, postController.reportPost);
router.post("/:postId/comments/:commentId/report", protect, guestBlock, postController.reportComment);





module.exports = router;