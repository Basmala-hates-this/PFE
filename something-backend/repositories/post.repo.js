// const fs = require("fs");//to connect to the json file(aka false database)
// const path = require("path");
// const filePath = path.join(__dirname, "../data/posts.json");//__dirname means "the folder this file is currently in"
// const userRepo = require("./user.repo");



// // Read posts from the JSON file
// const readPosts = () => {
//   const data = fs.readFileSync(filePath, "utf8");
//   return JSON.parse(data);
// };

// // Write posts to the JSON file
// const writePosts = (postsList) => {
//   fs.writeFileSync(filePath, JSON.stringify(postsList));
// };
// //ps: i'm not writing much comments only because i'm new to backend and i want it to stay clean so i can find my way easily...
// //the more i get used to it the more comments will return
// const createPost = (postData) => {
//    const posts = readPosts();
//   const newPost = {
//     id: Date.now().toString(),
//     authorId: postData.authorId,
//     authorUsername: postData.authorUsername,
//     authorRole: postData.authorRole,
//     roomId: postData.roomId,
//     title: postData.title,
//     content: postData.content,
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//     isUpdated: false,
//     isHidden: false,
//     reports: [],
//     resourceApproved: null,
//     votes: { useful: 0, useless: 0 },
//     comments: [],
//     image: postData.image || null,
//     pdf: postData.pdf || null,
//     resourceLink: postData.resourceLink || null,
//     resourceLabel: postData.resourceLabel || null,
     
//   };
// // console.log("saving post with roomId:", newPost.roomId);
//    posts.push(newPost);
//   writePosts(posts);
//   return newPost;
// };

// const getPostById = (id) => {
//   const posts = readPosts();
//   return posts.find((p) => p.id === id);
// };


// const getPostsAll = (roomId) => {
//     const posts = readPosts();
//   if (roomId) {
//     return posts.filter((p) => p.roomId === roomId);
//   }
//   return readPosts();
// };


// const votePost = (postId, userId, voteType) => {
//   const posts = readPosts();
//   const post = posts.find((p) => p.id === postId);
  
//   if (!post) return null;
  
//   if (post.authorId === userId) {
//     return { error: "Cannot vote on your own post" };
//   }
//   //since i add and delete....this is a procution of me testing accounts that didnt have the vote array yet...because i'm too damn stupidly lazy i didnt want to delete all of them just to rectreate them again
//   if (!post.votes.voters) post.votes.voters = [];

//   // 3 caases: no existing vote, same vote (remove), different vote (switch)
//   const existingVote = post.votes.voters.find((v) => v.userId === userId);
//   // add this line before the existingVote check
   
//   if (!existingVote) {
//   post.votes.voters.push({ userId, type: voteType });
//   post.votes[voteType]++;
// }
// else if (existingVote.type === voteType) {
//   post.votes.voters = post.votes.voters.filter((v) => v.userId !== userId);
//   post.votes[voteType]--;
// }
// else {
//   const oldType = existingVote.type;
//   post.votes[oldType]--;
//   existingVote.type = voteType;
//   post.votes[voteType]++;
//   userRepo.updateRating(post.authorId, oldType, "remove");   
//   userRepo.updateRating(post.authorId, voteType, "add"); 
// }
// // if (!existingVote) {
// //   userRepo.updateRating(post.authorId, voteType, "add");
// // } else if (existingVote.type === voteType) {
// //   userRepo.updateRating(post.authorId, voteType, "remove");
// // } else {
// //   userRepo.updateRating(post.authorId, existingVote.type, "remove");
// //   userRepo.updateRating(post.authorId, voteType, "add"); 
// // }


 

//   // auto-hide threshold
// const USELESS_THRESHOLD = 20;

// if (post.votes.useless >= USELESS_THRESHOLD && !post.isHidden) {
//   post.isHidden = true;
//   post.autoHidden = true; // flag so admins know it was auto-hidden vs manually hidden
// }

//  writePosts(posts);
//   return post;
// };

// const updatePost = (postId, userId, updatedData) => {
//   const posts = readPosts();
//   const postIndex = posts.findIndex((p) => p.id === postId);
//   if (postIndex === -1) return null;

//   if (posts[postIndex].authorId !== userId) {
//     return { error: "Not authorized to edit this post" };
//   }

//   const updatedPost = {
//     ...posts[postIndex],
//     title: updatedData.title,
//     content: updatedData.content,
//     updatedAt: new Date().toISOString(),
//     isUpdated: true
//   };
//   posts[postIndex] = updatedPost;
//   writePosts(posts);
//   return updatedPost;
// };

// const deletePost = (postId,userId) => {
//   const posts = readPosts();
//   const postIndex = posts.findIndex((p) => p.id === postId);
  
//   if (postIndex === -1) return false;//null....false....all the same...if post not found ..exit

//   if (posts[postIndex].authorId !== userId) {
//     return { error: "Nop...u  are not deleting this one " };
//   }
//     posts.splice(postIndex, 1);
//     writePosts(posts);
//     return true;
// };

// const addComment = (postId, commentData) => {
//   const posts = readPosts();
//   const post = posts.find((p) => p.id === postId);
  
//   if (!post) return null;

//  const newComment = {
//   id: Date.now().toString(),
//   postId,
//   authorId: commentData.authorId,
//   authorUsername: commentData.authorUsername,
//   content: commentData.content,
//   createdAt: new Date().toISOString(),
//   isUpdated: false,
//   isHidden: false,
//   reports: [],
//   parentCommentId: commentData.parentCommentId || null,
//   image: commentData.image || null,
//   pdf: commentData.pdf || null,
//   resourceLink: commentData.resourceLink || null,
//   resourceLabel: commentData.resourceLabel || null,
//   votes: { useful: 0, useless: 0, specialized: 0, voters: [] }
// };

//   post.comments.push(newComment);
//   writePosts(posts);
//   return newComment;
// };


// const deleteComment = (commentId, postId, userId) => {
//   const posts = readPosts();

//   const postIndex = posts.findIndex((p) => p.id === postId);
//    if (postIndex === -1) return false;//null....false....all the same...if post not found ..exit
//   const commentIndex = posts[postIndex].comments.findIndex((c) => c.id === commentId);
  
 
//   if (commentIndex === -1) return false;

//   if (posts[postIndex].comments[commentIndex].authorId !== userId) {
//     return { error: "Nop...u  are not deleting this one " };
//   }
//     posts[postIndex].comments.splice(commentIndex, 1);
//     writePosts(posts);
//     return true;
// };
// const voteComment=(postId,userId,voteType,commentId)=>{
//    const posts = readPosts();

 
//  const post = posts.find((p) => p.id === postId);
// if (!post) return null;

// const comment = post.comments.find((c) => c.id === commentId);
// if (!comment) return null;

// if (comment.authorId === userId) {
//   return { error: "cant vote on own comment" };
// }


//   const existingVote = comment.votes.voters.find((v) => v.userId === userId);
//   if (!existingVote) {
//   comment.votes.voters.push({ userId, type: voteType });
//   comment.votes[voteType]++;
// }
// else if (existingVote.type === voteType) {
//   comment.votes.voters = comment.votes.voters.filter((v) => v.userId !== userId);
//   comment.votes[voteType]--;
// }
// else {
//   comment.votes[existingVote.type]--;
//   existingVote.type = voteType;
//   comment.votes[voteType]++;
// }
// if (!existingVote) {
//   userRepo.updateRating(comment.authorId, voteType, "add");
// } else if (existingVote.type === voteType) {
//   userRepo.updateRating(comment.authorId, voteType, "remove");
// } else {
//   userRepo.updateRating(comment.authorId, existingVote.type, "remove");
//   userRepo.updateRating(comment.authorId, voteType, "add");
// }

//   writePosts(posts);

//   const USELESS_THRESHOLD = 20;

// if (comment.votes.useless >= USELESS_THRESHOLD && !comment.isHidden) {
//   comment.isHidden = true;
//   comment.autoHidden = true;
// }


//   return post;
// }

// //something about vs code is pissing me off.....why is vs code buggy now?
// const getPostsByUser = (userId) => {
//   const posts = readPosts();
//   return posts.filter((p) => p.authorId === userId);
// };
// const getCommentsByUser = (userId) => {
//   const posts = readPosts();
//   const comments = [];
//   posts.forEach(post => {
//     post.comments.forEach(comment => {
//       if (comment.authorId === userId) {
//         comments.push({ ...comment, postId: post.id }); // 👈 attach it here
//       }
//     });
//   });
//   return comments;
// };


// const updateComment = (postId, commentId, userId, content) => {
//   const posts = readPosts();
//   const post = posts.find((p) => p.id === postId);
//   if (!post) return null;

//   const comment = post.comments.find((c) => c.id === commentId);
//   if (!comment) return null;

//   if (comment.authorId !== userId) {
//     return { error: "Not authorized to edit this comment" };
//   }

//   comment.content = content;
//   comment.isUpdated = true;

//   writePosts(posts);
//   return comment;
// };


// const reportPost = (postId, reportData) => {
//   const posts = readPosts();
//   const post = posts.find((p) => p.id === postId);
//   if (!post) return { error: "Post not found" };

//   if (!post.reports) post.reports = [];

//   // prevent duplicate reports from same user
//   const alreadyReported = post.reports.some(r => r.reportedBy === reportData.reportedBy);
//   if (alreadyReported) return { error: "Already reported" };

//   post.reports.push({
//     reportedBy: reportData.reportedBy,
//     reason: reportData.reason,
//     details: reportData.details || "",
//     createdAt: new Date().toISOString()
//   });

//   writePosts(posts);
//   return post;
// };

// const reportComment = (postId, commentId, reportData) => {
//   const posts = readPosts();
//   const post = posts.find((p) => p.id === postId);
//   if (!post) return { error: "Post not found" };

//   const comment = post.comments.find((c) => c.id === commentId);
//   if (!comment) return { error: "Comment not found" };

//   if (!comment.reports) comment.reports = [];

//   const alreadyReported = comment.reports.some(r => r.reportedBy === reportData.reportedBy);
//   if (alreadyReported) return { error: "Already reported" };

//   comment.reports.push({
//     reportedBy: reportData.reportedBy,
//     reason: reportData.reason,
//     details: reportData.details || "",
//     createdAt: new Date().toISOString()
//   });

//   writePosts(posts);
//   return comment;
// };


// module.exports = {
//   createPost,
//   getPostsAll,
//   getPostById,
//   updatePost,
//   deletePost,
//   votePost,
//   addComment,
//   deleteComment,
//   voteComment,
//   getPostsByUser,
//   getCommentsByUser,
//   updateComment,
//   writePosts,
//   reportPost,
//   reportComment,
// };


const pool = require('../db');

const createPost = async (postData) => {
  const result = await pool.query(
    `INSERT INTO posts 
      (room_id, user_id, author_username, author_role, title, content, image_url, pdf_url, resource_link, resource_label)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      postData.roomId,
      postData.authorId,
      postData.authorUsername,
      postData.authorRole,
      postData.title || null,
      postData.content,
      postData.image || null,
      postData.pdf || null,
      postData.resourceLink || null,
      postData.resourceLabel || null,
    ]
  );
  return result.rows[0];
};

const getPostById = async (id) => {
  const result = await pool.query(`SELECT * FROM posts WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

const getPostsByRoom = async (roomId) => {
  const result = await pool.query(
    `SELECT * FROM posts WHERE room_id = $1 ORDER BY created_at DESC`,
    [roomId]
  );
  return result.rows;
};

const getPostsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const updatePost = async (postId, userId, updatedData) => {
  const post = await getPostById(postId);
  if (!post) return null;
  if (post.user_id !== userId) return { error: 'Not authorized to edit this post' };

  const result = await pool.query(
    `UPDATE posts SET title = $1, content = $2, is_updated = true
     WHERE id = $3 RETURNING *`,
    [updatedData.title, updatedData.content, postId]
  );
  return result.rows[0];
};

const deletePost = async (postId, userId) => {
  const post = await getPostById(postId);
  if (!post) return false;
  if (post.user_id !== userId) return { error: 'Not authorized to delete this post' };

  await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);
  return true;
};

const hidePost = async (postId) => {
  await pool.query(
    `UPDATE posts SET is_hidden = true WHERE id = $1`,
    [postId]
  );
};

const unhidePost = async (postId) => {
  await pool.query(
    `UPDATE posts SET is_hidden = false, auto_hidden = false WHERE id = $1`,
    [postId]
  );
};

const getSavedPostsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT p.* FROM posts p
     JOIN saved_posts sp ON sp.post_id = p.id
     WHERE sp.user_id = $1
     ORDER BY sp.saved_at DESC`,
    [userId]
  );
  return result.rows;
};

const approveResource = async (postId, approved) => {
  const result = await pool.query(
    `UPDATE posts SET resource_approved = $1 WHERE id = $2 RETURNING *`,
    [approved, postId]
  );
  return result.rows[0];
};

module.exports = {
  createPost,
  getPostById,
  getPostsByRoom,
  getPostsByUser,
  updatePost,
  deletePost,
  hidePost,
  unhidePost,
  getSavedPostsByUser,
  approveResource,
};