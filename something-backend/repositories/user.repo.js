let users = [];

const createUser = (userData) => {
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    verificationStatus: userData.role === 'professor' ? 'pending' : 'none',
    authorityLevel: 'user',
    permissions: []   
  };

  users.push(newUser);
  return newUser;
};

const findByEmail = (email) => {
  return users.find((u) => u.email === email);
};
const findByUsername = (username) => {
  return users.find((u) => u.username === username);
};

const findById = (id) => {
  return users.find((u) => u.id === id);
};

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
};
