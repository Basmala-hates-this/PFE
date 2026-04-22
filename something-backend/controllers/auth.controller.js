// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const userRepo = require("../repositories/user.repo");
// const roomRepo = require("../repositories/room.repo");
// const { sendResetEmail } = require("../config/email");

// const register = async (req, res) => {
//   const { 
//   fullName,
//   birthDate,
//   email,

//   role,
 
//   username,
//   password } = req.body;

//   const university = JSON.parse(req.body.university);
//   const majors = JSON.parse(req.body.majors);


//   const existing = userRepo.findByEmail(email);
//   if (existing) {
//     return res.status(400).json({ message: "Email already exists" });
//   }
//   const existingUsername = userRepo.findByUsername(username);
//   if (existingUsername) {
//     return res.status(400).json({ message: "Username already exists" });
//   }

//   const hashed = await bcrypt.hash(password, 10);


  

//   if (role === "professor" && !req.file) {
//   return res.status(400).json({ message: "Proof of professor status is required" });
// }


// const proofFile = req.file
//   ? `http://localhost:5000/uploads/${req.file.filename}`
//   : null;

//   const user = userRepo.createUser({
//     fullName,
//     birthDate,
//     email,
//     university,
//     role,
//     majors,
//     username,
//     password: hashed,
//     proofFile,
    
//   });
//     // find or create public room
// let publicRoom = roomRepo.getRoomsByType("public", null)[0];
// if (!publicRoom) {
//   publicRoom = roomRepo.createRoom({
//     name: "Public Space",
//     type: "public",
//   });
// }
// roomRepo.addMember(publicRoom.id, user.id);

// //uni room
// let universityRoom = roomRepo.getRoomsByType("university", user.university.code)[0];
// if (!universityRoom) {
//   universityRoom = roomRepo.createRoom({
//     name: user.university.name,
//     type: "university",
//     university: user.university.code
//   });
// }
// roomRepo.addMember(universityRoom.id, user.id);
// //eeAAAAHHHHHHHHHHHHHHGGGG............
// //major room(s)
// const roomIds = [publicRoom.id, universityRoom.id];

// // loop through majors(damn profs....)
// for (const major of user.majors) {
  
//   let majorRoom = roomRepo.getRoomsByType("major", major)[0];
//   if (!majorRoom) {
//     majorRoom = roomRepo.createRoom({
//       name: major,
//       type: "major",
//       major: major,
//     });
//   }
//   roomRepo.addMember(majorRoom.id, user.id);
//   roomIds.push(majorRoom.id);

// }


// const updatedUser = userRepo.updateUser(user.id, { rooms: roomIds });


//   const { password: _, ...userWithoutPassword } = updatedUser;


//   const token = jwt.sign(
//   { id: user.id, role: user.role, email: user.email, username: user.username, authorityLevel: user.authorityLevel, verificationStatus: user.verificationStatus },
//   process.env.JWT_SECRET,
//   { expiresIn: "24h" }
// );




// res.status(201).json({ message: "User created", user: userWithoutPassword, token });  
// };


// const login = async (req, res) => {
//   const { identifier, password } = req.body;

//   const isEmail = identifier.includes("@");
// const user = isEmail ? userRepo.findByEmail(identifier) : userRepo.findByUsername(identifier);
//   if (!user) {
//     return res.status(400).json({ message: "Invalid credentials" });
//   }

//   const match = await bcrypt.compare(password, user.password);
//   if (!match) {
//     return res.status(400).json({ message: "Invalid credentials" });
//   }
// //suspended users wont log in
//    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
//     return res.status(403).json({ 
//       message: `Your account is suspended until ${new Date(user.suspendedUntil).toLocaleDateString()}. Reason: ${user.suspensionReason || "Policy violation"}`
//     });
//   }

//   const token = jwt.sign(
//     { id: user.id,
//     role: user.role,
//     email: user.email,
//     username: user.username,
//     authorityLevel: user.authorityLevel,
//     verificationStatus: user.verificationStatus },
//     process.env.JWT_SECRET,
//     { expiresIn: "24h" }
//   );
//   const { password: _, ...userWithoutPassword } = user;

//   res.json({ 
//   token,
//   user: userWithoutPassword 
// });//so token as id and user for frontend to display user info without password,only generated in login process
// };
// const checkEmail = (req, res) => {
 
//   const { email } = req.query;
//   const user = userRepo.findByEmail(email);
//   res.json({ exists: !!user });//new trick  unlocked,!! to transfer object to boolean

// };
// const checkUsername = (req, res) => {
  
//   const { username } = req.query;
//   const user = userRepo.findByUsername(username);
//   res.json({ exists: !!user });
// };







// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   // check if email exists
//   const user = userRepo.findByEmail(email);
//   if (!user) {
//     // don't reveal if email exists or not — security best practice
//     return res.json({ message: "If that email exists, a reset link has been sent." });
//   }

//   // generate reset token — expires in 15 minutes
//   const resetToken = jwt.sign(
//     { email: user.email, id: user.id },
//     process.env.JWT_SECRET,
//     { expiresIn: "15m" }
//   );

//   // build reset link
//   const resetLink = `http://localhost:5173/reset?token=${resetToken}`;

//   // send email
//   try {
//     await sendResetEmail(user.email, resetLink);
//     res.json({ message: "If that email exists, a reset link has been sent." });
//   } catch (err) {
//     console.error("Email sending failed:", err);
//     res.status(500).json({ message: "Failed to send reset email." });
//   }
// };

// //the reset password flow would be 2 cases
// //case one is for account recovery ...email link and all
// //case two is for normal password reset for all in all user desire

// const resetPassword = async (req, res) => {
//   const { token, newPassword } = req.body;

//   if (!token || !newPassword) {
//     return res.status(400).json({ message: "Token and new password are required" });
//   }

//   // verify the token
//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//   } catch (err) {
//     return res.status(400).json({ message: "Invalid or expired reset token" });
//   }

//   const user = userRepo.findByEmail(decoded.email);
//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   const hashed = await bcrypt.hash(newPassword, 10);
//   userRepo.updateUser(user.id, { password: hashed });

//   res.json({ message: "Password updated successfully" });
// };


// const resetPasswordAuth = async (req, res) => {
//   const { newPassword } = req.body;
  
//   if (!newPassword) {
//     return res.status(400).json({ message: "New password is required" });
//   }

//   const user = userRepo.findByEmail(req.user.email);
//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   const hashed = await bcrypt.hash(newPassword, 10);
//   userRepo.updateUser(user.id, { password: hashed });


//   res.json({ message: "Password updated successfully" });
// };


// const guestLogin = (req, res) => {
//   const { selectedUniversities } = req.body;
  
//   const guestToken = jwt.sign(
//     { 
//       role: "guest",
//       selectedUniversities: selectedUniversities || []
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: "2h" }
//   );

//   res.json({ guestToken });
// };






// module.exports = {
//   register,
//   login,
//   checkEmail,
//   checkUsername,
//   forgotPassword,
//   resetPassword,
//   resetPasswordAuth,
//   guestLogin,
// };


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repo');
const roomRepo = require('../repositories/room.repo');
const pool = require('../db');
const { sendResetEmail } = require('../config/email');
const toCamel = require('../utils/toCamel');



const getUserMajors = async (userId) => {
  const result = await pool.query(
    `SELECT m.name FROM majors m
     JOIN user_majors um ON um.major_id = m.id
     WHERE um.user_id = $1`,
    [userId]
  );
  return result.rows.map(r => r.name);
};


const register = async (req, res) => {
  const { fullName, birthDate, email, role, username, password } = req.body;
  const university = JSON.parse(req.body.university);
  const majors = JSON.parse(req.body.majors);

  const existing = await userRepo.findByEmail(email);
  if (existing) return res.status(400).json({ message: 'Email already exists' });

  const existingUsername = await userRepo.findByUsername(username);
  if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

  if (role === 'professor' && !req.file) {
    return res.status(400).json({ message: 'Proof of professor status is required' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const proofFileUrl = req.file
    ? `http://localhost:5000/uploads/${req.file.filename}`
    : null;
const isDefaultUni = DEFAULT_UNIVERSITIES.some(u => u.code === university.code);

    //u cant insert a uni that desnt exist huh....
    await pool.query(
  `INSERT INTO universities (code, name, status)
   VALUES ($1, $2, $3)
   ON CONFLICT (code) DO NOTHING`,
  [university.code, university.name, university.status]
);

  // create user
  const user = await userRepo.createUser({
    fullName,
    birthDate,
    email,
    username,
    passwordHash,
    role,
    universityCode: university.code,
    universityName: university.name,
    profilePicUrl: null,
    proofFileUrl,
  });
const hasCustomUni = !DEFAULT_UNIVERSITIES.find(u => u.code === university.code);
const hasCustomMajor = majors.some(m => !DEFAULT_MAJORS.includes(m));

if (hasCustomUni || hasCustomMajor) {
  await pool.query(
    `UPDATE users SET other_input_status = 'pending' WHERE id = $1`,
    [user.id]
  );
}
  // insert majors — look up major_id from name
// insert majors — create if doesn't exist yet (custom input)
for (const majorName of majors) {
  let majorId;
  const majorResult = await pool.query(
    `SELECT id FROM majors WHERE name = $1`, [majorName]
  );
  if (majorResult.rows.length > 0) {
    majorId = majorResult.rows[0].id;
  } else {
  const isDefaultMajor = DEFAULT_MAJORS.includes(majorName);

const newMajor = await pool.query(
  `INSERT INTO majors (name, status)
   VALUES ($1, $2)
   RETURNING id`,
  [majorName, isDefaultMajor ? 'approved' : 'pending']
);
    majorId = newMajor.rows[0].id;
  }
  await pool.query(
    `INSERT INTO user_majors (user_id, major_id) VALUES ($1,$2)
     ON CONFLICT (user_id, major_id) DO NOTHING`,
    [user.id, majorId]
  );
}

  // add to public room
  const publicRoomResult = await pool.query(
    `SELECT id FROM rooms WHERE type = 'public' LIMIT 1`
  );
  if (publicRoomResult.rows.length > 0) {
    await roomRepo.addMember(publicRoomResult.rows[0].id, user.id);
  }

  // add to university room
 let uniRoomResult = await pool.query(
  `SELECT id FROM rooms 
   WHERE type = 'university' AND university_code = $1`,
  [university.code]
);

let roomId;

if (uniRoomResult.rows.length > 0) {
  roomId = uniRoomResult.rows[0].id;
} else {
  const newRoom = await pool.query(
    `INSERT INTO rooms (type, university_code)
     VALUES ('university', $1)
     RETURNING id`,
    [university.code]
  );
  roomId = newRoom.rows[0].id;
}

// ALWAYS add user
await roomRepo.addMember(roomId, user.id);

  // add to major room(s)
 for (const majorName of majors) {
  const majorRes = await pool.query(
    `SELECT id FROM majors WHERE name = $1`,
    [majorName]
  );

  if (majorRes.rows.length === 0) continue;

  const majorId = majorRes.rows[0].id;

  // check if room exists
  let roomRes = await pool.query(
    `SELECT id FROM rooms WHERE type = 'major' AND major_id = $1`,
    [majorId]
  );

  let roomId;

  if (roomRes.rows.length > 0) {
    roomId = roomRes.rows[0].id;
  } else {
    const newRoom = await pool.query(
      `INSERT INTO rooms (type, major_id)
       VALUES ('major', $1)
       RETURNING id`,
      [majorId]
    );
    roomId = newRoom.rows[0].id;
  }

  await roomRepo.addMember(roomId, user.id);
}

 const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
    email: user.email,
    username: user.username,
    authorityLevel: user.authorityLevel,
    verificationStatus: user.verificationStatus,
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

const { passwordHash: _pw, ...userWithoutPassword } = user;
 let userMajors = await getUserMajors(user.id);
res.status(201).json({ message: 'User created', user: { ...userWithoutPassword, majors: userMajors }, token });
};

const login = async (req, res) => {
  const { identifier, password } = req.body;

  const isEmail = identifier.includes('@');
  const user = isEmail
    ? await userRepo.findByEmail(identifier)
    : await userRepo.findByUsername(identifier);

  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(400).json({ message: 'Invalid credentials' });

 if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
  return res.status(403).json({
    message: `Your account is suspended until ${new Date(user.suspendedUntil).toLocaleDateString()}. Reason: ${user.suspensionReason || 'Policy violation'}`
  });
}

 const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
    email: user.email,
    username: user.username,
    authorityLevel: user.authorityLevel,
    verificationStatus: user.verificationStatus,
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

const { passwordHash: _pw, ...userWithoutPassword } = user;
const majors = await getUserMajors(user.id);
res.json({ token, user: { ...userWithoutPassword, majors } });
};

const checkEmail = async (req, res) => {
  const { email } = req.query;
  const user = await userRepo.findByEmail(email);
  res.json({ exists: !!user });
};

const checkUsername = async (req, res) => {
  const { username } = req.query;
  const user = await userRepo.findByUsername(username);
  res.json({ exists: !!user });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await userRepo.findByEmail(email);
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = jwt.sign(
    { email: user.email, id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const resetLink = `http://localhost:5173/reset?token=${resetToken}`;

  try {
    await sendResetEmail(user.email, resetLink);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Email sending failed:', err);
    res.status(500).json({ message: 'Failed to send reset email.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  const user = await userRepo.findByEmail(decoded.email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await userRepo.updateUser(user.id, { passwordHash });

  res.json({ message: 'Password updated successfully' });
};

const resetPasswordAuth = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ message: 'New password is required' });

  const user = await userRepo.findByEmail(req.user.email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await userRepo.updateUser(user.id, { passwordHash });

  res.json({ message: 'Password updated successfully' });
};

const guestLogin = (req, res) => {
  const { selectedUniversities } = req.body;

  const guestToken = jwt.sign(
    {
      role: 'guest',
      selectedUniversities: selectedUniversities || []
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
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