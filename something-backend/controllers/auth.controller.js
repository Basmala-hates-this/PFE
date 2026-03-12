const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/user.repo");
const roomRepo = require("../repositories/room.repo");

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


module.exports = {
  register,
  login,
  checkEmail,
  checkUsername,
};