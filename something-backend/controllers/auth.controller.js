const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/user.repo");
const roomRepo = require("../repositories/room.repo");
const sendResetEmail = require("../config/email");

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
    // find or create public room
let publicRoom = roomRepo.getRoomsByType("public", null)[0];
if (!publicRoom) {
  publicRoom = roomRepo.createRoom({
    name: "Public Space",
    type: "public",
  });
}
roomRepo.addMember(publicRoom.id, user.id);

//uni room
let universityRoom = roomRepo.getRoomsByType("university", user.university.code)[0];
if (!universityRoom) {
  universityRoom = roomRepo.createRoom({
    name: user.university.name,
    type: "university",
    university: user.university.code
  });
}
roomRepo.addMember(universityRoom.id, user.id);
//eeAAAAHHHHHHHHHHHHHHGGGG............
//major room(s)
const roomIds = [publicRoom.id, universityRoom.id];

// loop through majors(damn profs....)
for (const major of user.majors) {
  
  let majorRoom = roomRepo.getRoomsByType("major", major)[0];
  if (!majorRoom) {
    majorRoom = roomRepo.createRoom({
      name: major,
      type: "major",
      major: major,
    });
  }
  roomRepo.addMember(majorRoom.id, user.id);
  roomIds.push(majorRoom.id);

}


const updatedUser = userRepo.updateUser(user.id, { rooms: roomIds });


  const { password: _, ...userWithoutPassword } = updatedUser;


  const token = jwt.sign(
  { id: user.id, role: user.role, email: user.email, username: user.username, authorityLevel: user.authorityLevel, verificationStatus: user.verificationStatus },
  process.env.JWT_SECRET,
  { expiresIn: "24h" }
);

res.status(201).json({ message: "User created", user: userWithoutPassword, token });  
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
    { expiresIn: "24h" }
  );
  const { password: _, ...userWithoutPassword } = user;

  res.json({ 
  token,
  user: userWithoutPassword 
});//so token as id and user for frontend to display user info without password,only generated in login process
};
const checkEmail = (req, res) => {
 
  const { email } = req.query;
  const user = userRepo.findByEmail(email);
  res.json({ exists: !!user });//new trick  unlocked,!! to transfer object to boolean

};
const checkUsername = (req, res) => {
  
  const { username } = req.query;
  const user = userRepo.findByUsername(username);
  res.json({ exists: !!user });
};







const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // check if email exists
  const user = userRepo.findByEmail(email);
  if (!user) {
    // don't reveal if email exists or not — security best practice
    return res.json({ message: "If that email exists, a reset link has been sent." });
  }

  // generate reset token — expires in 15 minutes
  const resetToken = jwt.sign(
    { email: user.email, id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  // build reset link
  const resetLink = `http://localhost:5173/reset?token=${resetToken}`;

  // send email
  try {
    await sendResetEmail(user.email, resetLink);
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Email sending failed:", err);
    res.status(500).json({ message: "Failed to send reset email." });
  }
};

//the reset password flow would be 2 cases
//case one is for account recovery ...email link and all
//case two is for normal password reset for all in all user desire

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  // verify the token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  const user = userRepo.findByEmail(decoded.email);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  userRepo.updateUser(user.id, { password: hashed });

  res.json({ message: "Password updated successfully" });
};


const resetPasswordAuth = async (req, res) => {
  const { newPassword } = req.body;
  
  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }

  const user = userRepo.findByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  userRepo.updateUser(user.id, { password: hashed });

  res.json({ message: "Password updated successfully" });
};


const guestLogin = (req, res) => {
  const { selectedUniversities } = req.body;
  
  const guestToken = jwt.sign(
    { 
      role: "guest",
      selectedUniversities: selectedUniversities || []
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ guestToken });
};


module.exports = {
  register,
  login,
  checkEmail,
  checkUsername,
  forgotPassword,
  resetPassword,
  resetPasswordAuth,
  guestLogin,
};