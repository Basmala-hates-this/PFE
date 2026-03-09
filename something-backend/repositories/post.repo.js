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

const createPost = (userData) => {
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

module.exports = {
  createPost,
  getPostById,
  getPostsAll
};