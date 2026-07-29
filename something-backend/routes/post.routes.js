const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const protect = require('../middleware/authMiddleware');
const { guestBlock, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const endorsementController = require('../controllers/peerEndorsement.controller');
const { getEmbedding, toVectorLiteral } = require("../utils/embeddings");

router.post('/', protect, guestBlock, upload.single('attachment'), postController.createPost);



router.get('/', optionalAuth, postController.getPostsAll);
router.get('/search', postController.searchPosts);
router.post('/check-similar', protect, postController.checkSimilarPost);

router.post('/:postId/save', protect, guestBlock, postController.savePost);
router.delete('/:postId/save', protect, guestBlock, postController.unsavePost);
router.get('/saved', protect, postController.getSavedPosts);

router.get('/user/:userId', protect, postController.getPostsByUser);
router.get('/user/:userId/comments', protect, postController.getCommentsByUser);

router.get('/:id', protect, postController.getPostById);
router.patch('/:id/vote', protect, guestBlock, postController.votePost);
router.patch('/:id', protect, guestBlock, upload.single('attachment'), postController.updatePost);
router.delete('/:id', protect, guestBlock, postController.deletePost);

router.patch('/:id/answered', protect, postController.toggleAnswered);
router.patch("/:id/difficulty", protect,postController.updateDifficulty);

router.get('/:postId/comments', protect, postController.getCommentsByPost);
router.post('/:postId/comments', protect, guestBlock, upload.single('attachment'), postController.addComment);
router.delete('/:postId/comments/:commentId', protect, guestBlock, postController.deleteComment);
router.patch('/:postId/comments/:commentId/vote', protect, guestBlock, postController.voteComment);
router.patch('/:postId/comments/:commentId', protect, guestBlock, postController.updateComment);

router.post('/:postId/report', protect, guestBlock, postController.reportPost);
router.post('/:postId/comments/:commentId/report', protect, guestBlock, postController.reportComment);


router.post('/comments/:commentId/endorse', protect, endorsementController.createEndorsement);
router.get('/users/:userId/endorsements', endorsementController.getEndorsementsForUser);


//man i have more then what i thought....ohh well....



module.exports = router;
//something to keep in mind,all routes should come befre IDs because things will break and u wont knw why.....