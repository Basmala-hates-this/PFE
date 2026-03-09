const fs = require("fs");//to connect to the json file(aka false database)
const path = require("path");
const filePath = path.join(__dirname, "../data/users.json");//__dirname means "the folder this file is currently in"

// Read users from the JSON file
const readUsers = () => {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

// Write users to the JSON file
const writeUsers = (usersList) => {
  fs.writeFileSync(filePath, JSON.stringify(usersList));
};

const createUser = (userData) => {
   const users = readUsers();
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    verificationStatus: userData.role === 'professor' ? 'pending' : 'none',
    authorityLevel: 'user',
    permissions: []   
  };

   users.push(newUser);
  writeUsers(users);
  return newUser;
};

const findByEmail = (email) => {
  const users = readUsers();
  return users.find((u) => u.email === email);
};
const findByUsername = (username) => {
  const users = readUsers();
  return users.find((u) => u.username === username);
};

const findById = (id) => {
  const users = readUsers();
  return users.find((u) => u.id === id);
};

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
};
