const fs = require("fs");//to connect to the json file(aka false database)
const path = require("path");
const filePath = path.join(__dirname, "../data/posts.json");//__dirname means "the folder this file is currently in"

// Read posts from the JSON file
const readPosts = () => {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

// Write posts to the JSON file
const writePosts = (postsList) => {
  fs.writeFileSync(filePath, JSON.stringify(postsList));
};
//ps: i'm not writing much comments only because i'm new to backend and i want it to stay clean so i can find my way easily...
//the more i get used to it the more comments will return
const createPost = (postData) => {
   const posts = readPosts();
  const newPost = {
    id: Date.now().toString(),
    authorId: postData.authorId,
    authorUsername: postData.authorUsername,
    roomId: postData.roomId,
    title: postData.title,
    content: postData.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isUpdated: false,
    votes: { useful: 0, useless: 0 },
    comments: []
     
  };

   posts.push(newPost);
  writePosts(posts);
  return newPost;
};

const getPostById = (id) => {
  const posts = readPosts();
  return posts.find((p) => p.id === id);
};
const getPostsAll = () => {
  return readPosts();
};


const votePost = (postId, userId, voteType) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === postId);
  
  if (!post) return null;
  
  if (post.authorId === userId) {
    return { error: "Cannot vote on your own post" };
  }

  // 3 caases: no existing vote, same vote (remove), different vote (switch)
  const existingVote = post.votes.voters.find((v) => v.userId === userId);
  if (!existingVote) {
  post.votes.voters.push({ userId, type: voteType });
  post.votes[voteType]++;
}
else if (existingVote.type === voteType) {
  post.votes.voters = post.votes.voters.filter((v) => v.userId !== userId);
  post.votes[voteType]--;
}
else {
  post.votes[existingVote.type]--;
  existingVote.type = voteType;
  post.votes[voteType]++;
}
  writePosts(posts);
  return post;
};

const updatePost = (postId, userId, updatedData) => {
  const posts = readPosts();
  const postIndex = posts.findIndex((p) => p.id === postId);
  if (postIndex === -1) return null;

  if (posts[postIndex].authorId !== userId) {
    return { error: "Not authorized to edit this post" };
  }

  const updatedPost = {
    ...posts[postIndex],
    title: updatedData.title,
    content: updatedData.content,
    updatedAt: new Date().toISOString(),
    isUpdated: true
  };
  posts[postIndex] = updatedPost;
  writePosts(posts);
  return updatedPost;
};

const deletePost = (postId,userId) => {
  const posts = readPosts();
  const postIndex = posts.findIndex((p) => p.id === postId);
  
  if (postIndex === -1) return false;//null....false....all the same...if post not found ..exit

  if (posts[postIndex].authorId !== userId) {
    return { error: "Nop...u  are not deleting this one " };
  }
    posts.splice(postIndex, 1);
    writePosts(posts);
    return true;
};

const addComment = (postId, commentData) => {
  const posts = readPosts();
  const post = posts.find((p) => p.id === postId);
  
  if (!post) return null;

 const newComment = {
  id: Date.now().toString(),
  postId,
  authorId: commentData.authorId,
  authorUsername: commentData.authorUsername,
  content: commentData.content,
  createdAt: new Date().toISOString(),
  isUpdated: false,
  parentCommentId: commentData.parentCommentId || null,
  votes: { useful: 0, useless: 0, specialized: 0, voters: [] }
};

  post.comments.push(newComment);
  writePosts(posts);
  return newComment;
};


const deleteComment = (commentId, postId, userId) => {
  const posts = readPosts();

  const postIndex = posts.findIndex((p) => p.id === postId);
   if (postIndex === -1) return false;//null....false....all the same...if post not found ..exit
  const commentIndex = posts[postIndex].comments.findIndex((c) => c.id === commentId);
  
 
  if (commentIndex === -1) return false;

  if (posts[postIndex].comments[commentIndex].authorId !== userId) {
    return { error: "Nop...u  are not deleting this one " };
  }
    posts[postIndex].comments.splice(commentIndex, 1);
    writePosts(posts);
    return true;
};



module.exports = {
  createPost,
  getPostById,
  getPostsAll,
  votePost,
  updatePost,
  deletePost
};
