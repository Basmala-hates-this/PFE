const postRepo = require('../repositories/post.repo');
const commentRepo = require('../repositories/comment.repo');
const voteRepo = require('../repositories/vote.repo');
const roomRepo = require('../repositories/room.repo');
const userRepo = require('../repositories/user.repo');
const pool = require('../db');
const toCamel = require('../utils/toCamel');
const notifService = require('../services/notificationService');
const { getEmbedding, toVectorLiteral } = require('../utils/embeddings');
const { classifyDifficulty } = require("../routes/ai");

//yay that cross specialty room id is finally here, now i can fuck around and find out for real
const CROSS_SPECIALTY_ROOM_ID = process.env.CROSS_SPECIALTY_ROOM_ID;


// --- suspension check ---
const isUserSuspendedInRoom = async (roomId, userId) => {
  const suspension = await roomRepo.getRoomSuspension(roomId, userId);
  if (!suspension) return false;
  return new Date(suspension.suspended_until) > new Date();
};

// --- posts ---



const createPost = async (req, res) => {
  const { title, content, roomId, resourceLink, resourceLabel, isQuestion, isStudyPartner, fromMajorId, intoMajorId } = req.body;
  const authorId = req.user.id;
  const authorUsername = req.user.username;
  const authorRole = req.user.role;

  if (await isUserSuspendedInRoom(roomId, authorId)) {
    return res.status(403).json({ message: 'You are suspended from posting in this room.' });
  }

  const room = await roomRepo.getRoomById(roomId);

  const isStudyPartnerFlag = room?.type === 'subject' && (isStudyPartner === true || isStudyPartner === 'true');

  let resolvedFromMajorId = null;
  let resolvedIntoMajorId = null;

  if (room?.type === 'cross_specialty') {
    if (!intoMajorId) {
      return res.status(400).json({ message: 'You must tag a major to ask into.' });
    }

    if (authorRole === 'professor') {
      if (!fromMajorId) {
        return res.status(400).json({ message: 'You must tag the major you are posting from.' });
      }
      const profMajorIds = await userRepo.getUserMajorIds(authorId);
      if (!profMajorIds.includes(fromMajorId)) {
        return res.status(403).json({ message: 'You can only tag a major you belong to.' });
      }
      resolvedFromMajorId = fromMajorId;
    } else {
     // students: no major_id column on users — major lives in user_majors like everyone else
  const studentMajorIds = await userRepo.getUserMajorIds(authorId);
  resolvedFromMajorId = studentMajorIds[0] || null;
    }

    if (resolvedFromMajorId === intoMajorId) {
      return res.status(400).json({ message: 'FROM and INTO majors must be different.' });
    }

    resolvedIntoMajorId = intoMajorId;
  }

  const image = req.file && req.file.mimetype.startsWith('image/') ? req.file.path : undefined;
  const pdf = req.file && req.file.mimetype === 'application/pdf' ? req.file.path : undefined;
  const video = req.file && req.file.mimetype.startsWith('video/') ? req.file.path : undefined;

  const newPost = await postRepo.createPost({
    title, content, roomId,
    authorId, authorUsername, authorRole,
    image, pdf, video,
    resourceLink: resourceLink || null,
    resourceLabel: resourceLabel || null,
    isQuestion: isQuestion === true || isQuestion === 'true',
    isStudyPartner: isStudyPartnerFlag,
    fromMajorId: resolvedFromMajorId,
    intoMajorId: resolvedIntoMajorId,
  });

  try {
    await notifService.notifyNewPost(roomId, authorId, authorUsername, room?.name || roomId, newPost.id, title);
  } catch (notifErr) {
    console.error('Post notification failed:', notifErr);
  }

  res.status(201).json(newPost); // unchanged, user gets their response now

  //  fire-and-forget, runs after the response, never blocks the user
  getEmbedding(`${title}\n${content}`)
    .then(embedding => pool.query(
      `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
      [toVectorLiteral(embedding), newPost.id]
    ))
    .catch(err => console.error(`Embedding generation failed for post ${newPost.id}:`, err.message));
//ze ai difficulty badge....m a m a  b o y mama's boy mama's boy......lost it again

if (newPost.isQuestion) {
  const io = req.app.get("io");

  classifyDifficulty(title, content)
    .then(difficulty => {
      if (difficulty) {
        return pool.query(`UPDATE posts SET difficulty = $1 WHERE id = $2`, [difficulty, newPost.id])
          .then(() => {
            io.to(newPost.roomId).emit("post_difficulty_set", {
              postId: newPost.id,
              difficulty,
            });
          });
      }
    })
    .catch(err => console.error(`Difficulty classification failed for post ${newPost.id}:`, err.message));
}


};

;

//adding room digest ...sounds weird but hold withme,could be nice to have....too much work ey?

const getPostById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || null; // handles guests
  const post = await postRepo.getPostById(id, userId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (post.isSystemGenerated) {
    const summaryResult = await pool.query(
      `SELECT highlights FROM room_summaries WHERE post_id = $1`,
      [id]
    );
    if (summaryResult.rows[0]) {
      post.highlights = summaryResult.rows[0].highlights;
    }
  }

  res.json(post);
};


const getPostsAll = async (req, res) => {
  const { roomId, sort, limit = 20, cursorCreatedAt, cursorId, onlyQuestions } = req.query;
  const userId = req.user?.id || null;
  const userRole = req.user?.role || null;
  const wantsQuestionsOnly = onlyQuestions === "true";

  let posts, nextCursor;

  if (roomId) {
    let viewerMajorIds = null;
    if (roomId === process.env.CROSS_SPECIALTY_ROOM_ID && userId) {
      const userMajorIds = await userRepo.getUserMajorIds(userId);
      viewerMajorIds = userRole === 'professor'
        ? userMajorIds
        : (userMajorIds[0] ? [userMajorIds[0]] : []);
    }

    const result = await postRepo.getPostsByRoom(roomId, userId, {
      limit: Number(limit),
      cursorCreatedAt: cursorCreatedAt || null,
      cursorId: cursorId ? Number(cursorId) : null,
      onlyQuestions: wantsQuestionsOnly,
      viewerMajorIds,
    });
    posts = result.posts;
    nextCursor = result.nextCursor;
  }  else {
    const params = [userId];
    let cursorClause = "";
    if (cursorCreatedAt && cursorId) {
      params.push(cursorCreatedAt, cursorId);
      cursorClause = `WHERE (p.created_at, p.id) < ($2, $3)`;
    }
    const questionClause = wantsQuestionsOnly
      ? (cursorClause ? `AND p.is_question = true` : `WHERE p.is_question = true`)
      : "";
    params.push(Number(limit));
    const limitParamIndex = params.length;

    const result = await pool.query(
      `SELECT p.*,
        COALESCE(v.useful, 0) as vote_useful,
        COALESCE(v.useless, 0) as vote_useless,
        COUNT(DISTINCT c.id) as comment_count,
        u.profile_pic_url as author_profile_pic,
        (SELECT type FROM votes WHERE post_id = p.id AND user_id = $1) as user_vote
       FROM posts p
       LEFT JOIN post_vote_counts v ON v.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       LEFT JOIN users u ON u.id = p.user_id
       ${cursorClause}
       ${questionClause}
       GROUP BY p.id, v.useful, v.useless, u.profile_pic_url
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT $${limitParamIndex}`,
      params
    );
    posts = toCamel(result.rows);
    nextCursor = result.rows.length === Number(limit)
      ? { createdAt: result.rows[result.rows.length - 1].created_at, id: result.rows[result.rows.length - 1].id }
      : null;
  }
  res.json({ posts, nextCursor, hasMore: !!nextCursor });
};

const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, resourceLink, resourceLabel, removeAttachment, isQuestion, isAnswered } = req.body;
  const userId = req.user.id;

  const existing = await postRepo.getPostById(id);
  if (!existing) return res.status(404).json({ message: 'Post not found' });
  if (existing.userId !== userId) return res.status(403).json({ message: 'Not authorized' });

  const newImage = req.file && req.file.mimetype.startsWith('image/')
    ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : undefined;
  const newPdf = req.file && req.file.mimetype === 'application/pdf'
    ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : undefined;
  const newVideo = req.file && req.file.mimetype.startsWith('video/')
    ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : undefined;

  const clearAttachment = removeAttachment === "true";

  const updatedPost = await postRepo.updatePost(id, userId, {
    title, content,
    resourceLink: resourceLink || null,
    resourceLabel: resourceLabel || null,
    image: newImage !== undefined ? newImage : (clearAttachment ? null : existing.imageUrl),
    pdf: newPdf !== undefined ? newPdf : (clearAttachment ? null : existing.pdfUrl),
    video: newVideo !== undefined ? newVideo : (clearAttachment ? null : existing.videoUrl),
    isQuestion,
    isAnswered,
  });

  res.json(updatedPost);
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await postRepo.deletePost(id, userId);
  if (!result) return res.status(404).json({ message: 'Post not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: 'Post deleted successfully' });
};

const votePost = async (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body;
  const userId = req.user.id;

  const post = await postRepo.getPostById(id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (await isUserSuspendedInRoom(post.room_id, userId)) {
    return res.status(403).json({ message: 'You are suspended from voting in this room.' });
  }

  const result = await voteRepo.votePost(id, userId, voteType);
  if (!result) return res.status(404).json({ message: 'Post not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json(result);
};

// --- comments ---

const addComment = async (req, res) => {
  const { postId } = req.params;
  const { content, parentCommentId, resourceLink, resourceLabel } = req.body;
  const authorId = req.user.id;
  const authorUsername = req.user.username;

  const post = await postRepo.getPostById(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (await isUserSuspendedInRoom(post.room_id, authorId)) {
    return res.status(403).json({ message: 'You are suspended from commenting in this room.' });
  }

  const image = req.file && req.file.mimetype.startsWith('image/')
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;
const pdf = req.file && req.file.mimetype === 'application/pdf'
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;
const video = req.file && req.file.mimetype.startsWith('video/')
  ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;


  const comment = await commentRepo.createComment({
    postId,
    authorId,
    authorUsername,
    content,
    parentCommentId: parentCommentId || null,
    image, pdf,video,
    resourceLink: resourceLink || null,
    resourceLabel: resourceLabel || null,
  });
  try {
  if (parentCommentId) {
    // reply to a comment — notify the parent comment owner
    const parentComment = await commentRepo.getCommentById(parentCommentId);
    if (parentComment && parentComment.userId !== authorId) {
      await notifService.notifyCommentReply(parentComment.userId, authorUsername, postId, post.roomId);
    }
  } else {
    // reply to a post — notify the post owner
    if (post.userId !== authorId) {
      await notifService.notifyPostReply(post.userId, authorUsername, postId, post.roomId);
    }
  }
} catch (notifErr) {
  console.error('Comment notification failed:', notifErr);
}

  res.status(201).json(comment);
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const result = await commentRepo.deleteComment(commentId, userId);
  if (!result) return res.status(404).json({ message: 'Comment not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: 'Comment deleted successfully' });
};

const voteComment = async (req, res) => {
  const { commentId } = req.params;
  const { voteType } = req.body;
  const userId = req.user.id;

  const comment = await commentRepo.getCommentById(commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  const post = await postRepo.getPostById(comment.post_id);
  if (await isUserSuspendedInRoom(post.room_id, userId)) {
    return res.status(403).json({ message: 'You are suspended from voting in this room.' });
  }

  const result = await voteRepo.voteComment(commentId, userId, voteType);
  if (!result) return res.status(404).json({ message: 'Comment not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json(result);
};

const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const updated = await commentRepo.updateComment(commentId, userId, content);
  if (!updated) return res.status(404).json({ message: 'Comment not found' });
  if (updated.error) return res.status(403).json({ message: updated.error });

  res.json(updated);
};


const getCommentsByPost = async (req, res) => {
  const { postId } = req.params;
  const { limit = 20, cursorCreatedAt, cursorId } = req.query;

  const { comments, nextCursor } = await commentRepo.getCommentsByPost(postId, {
    limit: Number(limit),
    cursorCreatedAt: cursorCreatedAt || null,
    cursorId: cursorId ? Number(cursorId) : null,
  });

  res.json({ comments, nextCursor, hasMore: !!nextCursor });
};
// --- user content ---

const getPostsByUser = async (req, res) => {
  const userId = req.params.userId;
  const posts = await postRepo.getPostsByUser(userId);
  res.json(posts);
};

const getCommentsByUser = async (req, res) => {
  const userId = req.params.userId;
  const comments = await commentRepo.getCommentsByUser(userId);
  res.json(comments);
};

// --- search ---

const searchPosts = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const result = await pool.query(
    `SELECT p.*,
      u.username as author_username,
      u.profile_pic_url as author_profile_pic
     FROM posts p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.content ILIKE $1 OR p.title ILIKE $1
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [`%${q}%`]
  );
 
  res.json(toCamel(result.rows));
};

// --- saved posts ---

const savePost = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  const post = await postRepo.getPostById(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const result = await userRepo.savePost(userId, postId);
  if (result.error) return res.status(400).json({ message: result.error });

  res.json({ message: 'Post saved' });
};

const unsavePost = async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  const result = await userRepo.unsavePost(userId, postId);
  if (result.error) return res.status(400).json({ message: result.error });

  res.json({ message: 'Post unsaved' });
};

const getSavedPosts = async (req, res) => {
  const userId = req.user.id;
  const posts = await postRepo.getSavedPostsByUser(userId);
  res.json(posts);
};

// --- reports ---

const reportPost = async (req, res) => {
  const { postId } = req.params;
  const { reason, details } = req.body;
  const reportedBy = req.user.id;

  if (!reason) return res.status(400).json({ message: 'Report reason is required' });

  try {
    await pool.query(
      `INSERT INTO reports (reported_by, post_id, reason, details) VALUES ($1,$2,$3,$4)`,
      [reportedBy, postId, reason, details || null]
    );
    res.json({ message: 'Post reported successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Already reported' });
    throw err;
  }
};

const reportComment = async (req, res) => {
  const { commentId } = req.params;
  const { reason, details } = req.body;
  const reportedBy = req.user.id;

  if (!reason) return res.status(400).json({ message: 'Report reason is required' });

  try {
    await pool.query(
      `INSERT INTO reports (reported_by, comment_id, reason, details) VALUES ($1,$2,$3,$4)`,
      [reportedBy, commentId, reason, details || null]
    );
    res.json({ message: 'Comment reported successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Already reported' });
    throw err;
  }
};



async function toggleAnswered(req, res) {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    const ownerId = await postRepo.getPostOwnerId(postId);

    if (!ownerId) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (ownerId !== userId) {
      return res.status(403).json({ error: 'Only the post author can update answered status' });
    }

    const updatedPost = await postRepo.toggleAnswered(postId);

    if (!updatedPost) {
      return res.status(400).json({ error: 'Post is not marked as a question' });
    }

    return res.status(200).json({ post: updatedPost });
  } catch (err) {
    console.error('toggleAnswered error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

const checkSimilarPost = async (req, res) => {
  const { content, roomId, roomType } = req.body;

  if (!["major", "subject"].includes(roomType)) return res.json({ match: null });
  if (!content || content.trim().length < 20) return res.json({ match: null });

  try {
    const embedding = await getEmbedding(content);
    const vectorLiteral = toVectorLiteral(embedding);

    const result = await pool.query(
      `SELECT id, title, 1 - (embedding <=> $1::vector) AS similarity
       FROM posts
       WHERE room_id = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 1`,
      [vectorLiteral, roomId]
    );

    const top = result.rows[0];
    const SIMILARITY_THRESHOLD = 0.82;

    if (top && top.similarity >= SIMILARITY_THRESHOLD) {
      return res.json({ match: { id: top.id, title: top.title, similarity: top.similarity } });
    }
    return res.json({ match: null });
  } catch (err) {
    console.error("Similarity check failed:", err.message);
    return res.json({ match: null });
  }
};




const updateDifficulty = async (req, res) => {
  const { id } = req.params;
  const { difficulty } = req.body;
  const validDifficulties = ["beginner", "intermediate", "advanced"];

  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).json({ message: "Invalid difficulty value." });
  }

  const post = await postRepo.getPostById(id);
  if (!post) return res.status(404).json({ message: "Post not found." });

  const isOwner = post.userId === req.user.id;
  const isPrivileged = req.user.authorityLevel === "admin" || req.user.authorityLevel === "superadmin";

  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ message: "Not authorized to edit this post's difficulty." });
  }

  const result = await pool.query(
    `UPDATE posts SET difficulty = $1 WHERE id = $2 RETURNING *`,
    [difficulty, id]
  );

  res.json(toCamel(result.rows[0]));
};



module.exports = {
  createPost,
  getPostById,
  getPostsAll,
  votePost,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  voteComment,
  updateComment,
  getCommentsByPost,
  getPostsByUser,
  getCommentsByUser,
  searchPosts,
  savePost,
  unsavePost,
  getSavedPosts,
  reportPost,
  reportComment,
  toggleAnswered,
  checkSimilarPost,
  updateDifficulty,


};