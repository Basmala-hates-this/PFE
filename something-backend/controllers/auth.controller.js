const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/user.repo");

const register = async (req, res) => {
  const { email, password } = req.body;

  const existing = userRepo.findByEmail(email);
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = userRepo.createUser({
    email,
    password: hashed,
    role: "user",
  });

  res.status(201).json({ message: "User created", user });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = userRepo.findByEmail(email);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
};

module.exports = {
  register,
  login,
};