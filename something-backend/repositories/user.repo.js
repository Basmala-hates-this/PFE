let users = [];

const createUser = (userData) => {
  const newUser = {
    id: Date.now().toString(),
    ...userData,
  };

  users.push(newUser);
  return newUser;
};

const findByEmail = (email) => {
  return users.find((u) => u.email === email);
};

const findById = (id) => {
  return users.find((u) => u.id === id);
};

module.exports = {
  createUser,
  findByEmail,
  findById,
};
