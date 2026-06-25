const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repo');
const roomRepo = require('../repositories/room.repo');
const pool = require('../db');
const { sendResetEmail, sendOtpEmail } = require('../config/email');
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


//man this will make the app slow as hell...
const isDefaultUniversity = async (code) => {
  const res = await pool.query(
    `SELECT 1 FROM universities WHERE code = $1 AND status = 'approved'`,
    [code]
  );
  return res.rows.length > 0;
};

const isDefaultMajor = async (name) => {
  const res = await pool.query(
    `SELECT 1 FROM majors WHERE name = $1 AND status = 'approved'`,
    [name]
  );
  return res.rows.length > 0;
};


const register = async (req, res) => {
  const { fullName, birthDate, email, role, username, password } = req.body;
  const university = JSON.parse(req.body.university);
  const majors = JSON.parse(req.body.majors);
  const uniIsDefault = await isDefaultUniversity(university.code);

  const existing = await userRepo.findByEmail(email);
  if (existing) return res.status(400).json({ message: 'Email already exists' });

  const existingUsername = await userRepo.findByUsername(username);
  if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

  if (role === 'professor' && !req.file) {
    return res.status(400).json({ message: 'Proof of professor status is required' });
  }
 // const proofFileUrl = req.file
  //   ? `http://localhost:5000/uploads/${req.file.filename}`
  //   : null;

  const passwordHash = await bcrypt.hash(password, 10);
 
// const proofFileUrl = req.file
//   ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}`
//   : null;
const proofFileUrl = req.file ? req.file.path : null;

    //u cant insert a uni that desnt exist huh....
   await pool.query(
  `INSERT INTO universities (code, name, status)
   VALUES ($1, $2, $3)
   ON CONFLICT (code) DO NOTHING`,
  [university.code, university.name, uniIsDefault ? 'approved' : 'pending']
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
const hasCustomUni = !(await isDefaultUniversity(university.code));
const hasCustomMajor = (await Promise.all(majors.map(isDefaultMajor))).some(v => !v);

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
 const isDefault = await isDefaultMajor(majorName);
const newMajor = await pool.query(
  `INSERT INTO majors (name, status) VALUES ($1, $2) RETURNING id`,
  [majorName, isDefault ? 'approved' : 'pending']
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
  `INSERT INTO rooms (type, university_code, name)
   VALUES ('university', $1, $2)
   RETURNING id`,
  [university.code, university.name]
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
  `INSERT INTO rooms (type, major_id, name)
   VALUES ('major', $1, $2)
   RETURNING id`,
  [majorId, majorName]
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

  // const resetLink = `http://localhost:5173/reset?token=${resetToken}`;
  const resetLink = `${process.env.FRONTEND_URL}/reset?token=${resetToken}`;

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

const getApprovedUniversities = async (req, res) => {
  const result = await pool.query(
    `SELECT code, name FROM universities WHERE status = 'approved' ORDER BY name ASC`
  );
  res.json(result.rows);
};

const getApprovedMajors = async (req, res) => {
  const result = await pool.query(
    `SELECT name FROM majors WHERE status = 'approved' ORDER BY name ASC`
  );
  res.json(result.rows.map(r => r.name));
};


//just to be clear...this is unnecessary and i am stupid 
const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  // generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // invalidate any previous unused OTPs for this email
  await pool.query(
    `UPDATE otp_verifications SET used = TRUE WHERE email = $1 AND used = FALSE`,
    [email]
  );

  // save new OTP
  await pool.query(
    `INSERT INTO otp_verifications (email, otp, expires_at) VALUES ($1, $2, $3)`,
    [email, otp, expiresAt]
  );

  // send email
  try {
    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    res.status(500).json({ message: 'Failed to send OTP email' });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  const result = await pool.query(
    `SELECT * FROM otp_verifications 
     WHERE email = $1 AND otp = $2 AND used = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [email, otp]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  const record = result.rows[0];

  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ message: 'OTP has expired' });
  }

  // mark as used
  await pool.query(
    `UPDATE otp_verifications SET used = TRUE WHERE id = $1`,
    [record.id]
  );

  res.json({ message: 'OTP verified successfully' });
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
  getApprovedUniversities,
  getApprovedMajors,
  sendOtp,
  verifyOtp,
};