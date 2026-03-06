const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/user.repo");

const register = async (req, res) => {
  const { 
  fullName,
  birthDate,
  email,
  university,
  role,
  majors,
  username,
  password } = req.body;

  const existing = userRepo.findByEmail(email);
  if (existing) {
    return res.status(400).json({ message: "Email already exists" });
  }
  const existingUsername = userRepo.findByUsername(username);
  if (existingUsername) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = userRepo.createUser({
    fullName,
    birthDate,
    email,
    university,
    role,
    majors,
    username,
    password: hashed,
    
  });
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({ message: "User created", user: userWithoutPassword });
};

const login = async (req, res) => {
  const { identifier, password } = req.body;

  const isEmail = identifier.includes("@");
const user = isEmail ? userRepo.findByEmail(identifier) : userRepo.findByUsername(identifier);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id,
    role: user.role,
    email: user.email,
    username: user.username,
    authorityLevel: user.authorityLevel,
    verificationStatus: user.verificationStatus },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  const { password: _, ...userWithoutPassword } = user;

  res.json({ 
  token,
  user: userWithoutPassword 
});
};

module.exports = {
  register,
  login,
};