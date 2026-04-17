// const roomRepo = require("../repositories/room.repo");
// const userRepo = require("../repositories/user.repo");



// const getMyRooms = (req, res) => {
//   const userId = req.user.id;
//   const user = userRepo.findById(userId);
  
//   // console.log("userId:", userId);
//   // console.log("user.rooms:", user?.rooms);fricking logs freezing the fricking server....
  
//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   const userRooms = roomRepo.getRoomsByIds(user.rooms);
//   //  console.log("userRooms found:", userRooms.length);
//   //who knew that console.log would freez the terminal and stop the app
  
//   res.json(userRooms);
// };

// const getPublicRooms = (req, res) => {
//   const rooms = roomRepo.getAllRooms();
//   const publicRooms = rooms.filter(r => r.type === "public" || r.type === "university");
//   res.json(publicRooms);
// };



// ///private room managment shit
// const createPrivateRoom = async (req, res) => {
//   const { name, passKey, invitedUsers = [] } = req.body;  const userId = req.user.id;
//   const username = req.user.username;

//   const finalPassKey = passKey || roomRepo.generatePassKey();

//   const room = roomRepo.createRoom({
//     name,
//     type: "private",
//     isPrivate: true,
//     passKey: finalPassKey,
//     createdBy: userId,
//   });

//   // add creator as first member and admin
//   roomRepo.addMember(room.id, userId);
//   roomRepo.addRoomAdmin(room.id, userId);

//   // add room to user's rooms
//   const userRepo = require("../repositories/user.repo");
//   const user = userRepo.findById(userId);
//   userRepo.updateUser(userId, { rooms: [...(user.rooms || []), room.id] });


//   const { sendRoomInviteEmail } = require("../config/email");

// for (const invitedId of invitedUsers) {
//   const invitedUser = userRepo.findById(invitedId);
//   if (!invitedUser) continue;

//   roomRepo.addMember(room.id, invitedId);
//   userRepo.updateUser(invitedId, { rooms: [...(invitedUser.rooms || []), room.id] });

//   try {
//     await sendRoomInviteEmail(invitedUser.email, invitedUser.username, room.name, username);
//   } catch (err) {
//     console.error("Failed to send invite email:", err);
//   }
// }

//   res.status(201).json(room);
// };

// const joinPrivateRoom = (req, res) => {
//   const { passKey } = req.body;
//   const userId = req.user.id;

//   const result = roomRepo.joinRoomByPassKey(passKey, userId);

//   if (result.error) {
//     return res.status(400).json({ message: result.error });
//   }

//   // add room to user's rooms
//   const userRepo = require("../repositories/user.repo");
//   const user = userRepo.findById(userId);
//   userRepo.updateUser(userId, { rooms: [...(user.rooms || []), result.room.id] });

//   res.json({ message: `Welcome to ${result.room.name}!`, room: result.room });
// };

// const deletePrivateRoom = (req, res) => {
//   const { roomId } = req.params;
//   const userId = req.user.id;

//   const result = roomRepo.deleteRoom(roomId, userId);
//   if (!result) return res.status(404).json({ message: "Room not found" });
//   if (result.error) return res.status(403).json({ message: result.error });

//   res.json({ message: "Room deleted" });
// };

// const renamePrivateRoom = (req, res) => {
//   const { roomId } = req.params;
//   const { name } = req.body;
//   const userId = req.user.id;

//   const result = roomRepo.renameRoom(roomId, userId, name);
//   if (!result) return res.status(404).json({ message: "Room not found" });
//   if (result.error) return res.status(403).json({ message: result.error });

//   res.json(result);
// };

// const upgradeToAdmin = (req, res) => {
//   const { roomId, memberId } = req.params;
//   const userId = req.user.id;

//   const result = roomRepo.addRoomAdmin(roomId, memberId, userId);
//   if (!result) return res.status(404).json({ message: "Room not found" });
//   if (result.error) return res.status(403).json({ message: result.error });

//   res.json({ message: "Member upgraded to admin" });
// };



// const getRoomById = (req, res) => {
//   const { roomId } = req.params;
//   const userId = req.user.id;
  
//   const room = roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: "Room not found" });
//   if (!room.members.includes(userId)) {
//     return res.status(403).json({ message: "You are not a member of this room" });
//   }
  
//   res.json(room);
// };



// //names better then ids.....
// const getRoomMembers = (req, res) => {
//   const { roomId } = req.params;
//   const userId = req.user.id;

//   const room = roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: "Room not found" });
//   if (!room.members.includes(userId)) {
//     return res.status(403).json({ message: "Not a member" });
//   }

//   const userRepo = require("../repositories/user.repo");
//   const members = room.members.map(memberId => {
//     const user = userRepo.findById(memberId);
//     return { id: memberId, username: user?.username || "Unknown" };
//   });

//   res.json(members);
// };


// const leaveRoom = (req, res) => {
//   const { roomId } = req.params;
//   const userId = req.user.id;

//   const result = roomRepo.leaveRoom(roomId, userId);
//   if (!result) return res.status(404).json({ message: "Room not found" });
//   if (result.error) return res.status(403).json({ message: result.error });

//   // remove room from user's rooms list
//   const userRepo = require("../repositories/user.repo");
//   const user = userRepo.findById(userId);
//   userRepo.updateUser(userId, { rooms: user.rooms.filter(id => id !== roomId) });

//   res.json({ message: "You have left the room" });
// };



// const getSubjectRoomsForUser = (req, res) => {
//   const userId = req.user.id;
//   const userRepo = require("../repositories/user.repo");
//   const subjectsMap = require("../data/subjectsMap.json");

//   const user = userRepo.findById(userId);
//   if (!user) return res.status(404).json({ message: "User not found" });

//   const userMajors = user.majors || [];
//   const rooms = roomRepo.getAllRooms();

//   const subjectRooms = rooms.filter(r =>
//     r.type === "subject" && userMajors.includes(r.major)
//   );

//   const result = userMajors.map(major => {
//      const existingRooms = subjectRooms.filter(r => r.major === major && r.members?.includes(userId));
//     const existingSubjects = subjectRooms.filter(r => r.major === major).map(r => r.name);
//     const allSubjects = subjectsMap[major] || [];
//     const availableSubjects = allSubjects.filter(s => !existingSubjects.includes(s));
   

//     return {
//       major,
//       rooms: existingRooms,
//       available: availableSubjects
//     };
//   });

//   res.json(result);
// };


// const joinSubjectRoom = async (req, res) => {
//   const userId = req.user.id;
//   const { roomId } = req.params;
//   const userRepo = require("../repositories/user.repo");
//   const { sendRoomInviteEmail } = require("../config/email");

//   const room = roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: "Room not found" });
//   if (room.type !== "subject") return res.status(400).json({ message: "Not a subject room" });

//   const user = userRepo.findById(userId);
//   if (!user.majors?.includes(room.major)) {
//     return res.status(403).json({ message: "You are not enrolled in this major" });
//   }

//   if (room.members?.includes(userId)) {
//     return res.status(400).json({ message: "Already joined" });
//   }

//   roomRepo.addMember(roomId, userId);
//   userRepo.updateUser(userId, { rooms: [...(user.rooms || []), roomId] });

//   try {
//     await sendRoomInviteEmail(user.email, user.username, room.name, "the platform");
//   } catch (err) {
//     console.error("Failed to send join email:", err);
//   }

//   res.json({ message: "Joined successfully" });
// };


// const leaveSubjectRoom = (req, res) => {
//   const userId = req.user.id;
//   const { roomId } = req.params;
//   const userRepo = require("../repositories/user.repo");

//   const room = roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: "Room not found" });

//   const result = roomRepo.leaveRoom(roomId, userId);
//   if (result?.error) return res.status(400).json({ message: result.error });

//   const user = userRepo.findById(userId);
//   userRepo.updateUser(userId, { rooms: (user.rooms || []).filter(id => id !== roomId) });

//   res.json({ message: "Left room successfully" });
// };




// const createSubjectRoom = async (req, res) => {
//   const userId = req.user.id;
//   const { major, subject } = req.body;
//   const userRepo = require("../repositories/user.repo");
//   const subjectsMap = require("../data/subjectsMap.json");

//   const user = userRepo.findById(userId);
//   if (!user.majors?.includes(major)) {
//     return res.status(403).json({ message: "You are not enrolled in this major" });
//   }

//   const validSubjects = subjectsMap[major] || [];
//   if (!validSubjects.includes(subject)) {
//     return res.status(400).json({ message: "Invalid subject for this major" });
//   }

//   // check if room already exists
//   const existing = roomRepo.getAllRooms().find(r =>
//     r.type === "subject" && r.major === major && r.name === subject
//   );
//   if (existing) {
//     // just join it instead
//     roomRepo.addMember(existing.id, userId);
//     userRepo.updateUser(userId, { rooms: [...(user.rooms || []), existing.id] });
//     return res.json({ message: "Joined existing room", room: existing });
//   }

//   const room = roomRepo.createRoom({
//     name: subject,
//     type: "subject",
//     major: major,
//     createdBy: "system",
//   });

//   roomRepo.addMember(room.id, userId);
//   userRepo.updateUser(userId, { rooms: [...(user.rooms || []), room.id] });

//   res.status(201).json({ message: "Room created and joined", room });
// };



// module.exports = {
//   getMyRooms, 
//   getPublicRooms,
//   createPrivateRoom,
//   joinPrivateRoom,
//   deletePrivateRoom,
//   renamePrivateRoom,
//   upgradeToAdmin,
//   getRoomById,
//   getRoomMembers,
//   leaveRoom,
//   getSubjectRoomsForUser,
//   joinSubjectRoom,
//   leaveSubjectRoom,
//   createSubjectRoom,

// };


const roomRepo = require('../repositories/room.repo');
const userRepo = require('../repositories/user.repo');
const { sendRoomInviteEmail } = require('../config/email');
const subjectsMap = require('../data/subjectsMap.json');

const getMyRooms = async (req, res) => {
  const userId = req.user.id;
  const rooms = await roomRepo.getUserRooms(userId);
  res.json(rooms);
};

const getPublicRooms = async (req, res) => {
  const rooms = await roomRepo.getAllRooms();
  const publicRooms = rooms.filter(r => r.type === 'public' || r.type === 'university');
  res.json(publicRooms);
};

// --- private rooms ---

const createPrivateRoom = async (req, res) => {
  const { name, passKey, invitedUsers = [] } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  const finalPassKey = passKey || roomRepo.generatePassKey();

  const room = await roomRepo.createRoom({
    name,
    type: 'private',
    isPrivate: true,
    passKey: finalPassKey,
    createdBy: userId,
  });

  // add creator as member and admin
  await roomRepo.addMember(room.id, userId, 'admin');

  // invite users
  for (const invitedId of invitedUsers) {
    const invitedUser = await userRepo.findById(invitedId);
    if (!invitedUser) continue;

    await roomRepo.addMember(room.id, invitedId, 'member');

    try {
      await sendRoomInviteEmail(invitedUser.email, invitedUser.username, room.name, username);
    } catch (err) {
      console.error('Failed to send invite email:', err);
    }
  }

  res.status(201).json(room);
};

const joinPrivateRoom = async (req, res) => {
  const { passKey } = req.body;
  const userId = req.user.id;

  const result = await roomRepo.joinRoomByPassKey(passKey, userId);
  if (result.error) return res.status(400).json({ message: result.error });

  res.json({ message: `Welcome to ${result.room.name}!`, room: result.room });
};

const deletePrivateRoom = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const result = await roomRepo.deleteRoom(roomId, userId);
  if (!result) return res.status(404).json({ message: 'Room not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: 'Room deleted' });
};

const renamePrivateRoom = async (req, res) => {
  const { roomId } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  const result = await roomRepo.renameRoom(roomId, userId, name);
  if (!result) return res.status(404).json({ message: 'Room not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json(result);
};

const upgradeToAdmin = async (req, res) => {
  const { roomId, memberId } = req.params;
  const userId = req.user.id;

  const result = await roomRepo.addRoomAdmin(roomId, memberId, userId);
  if (!result) return res.status(404).json({ message: 'Room not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: 'Member upgraded to admin' });
};

const getRoomById = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const member = await roomRepo.isMember(roomId, userId);
  if (!member) return res.status(403).json({ message: 'You are not a member of this room' });

  res.json(room);
};

const getRoomMembers = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const member = await roomRepo.isMember(roomId, userId);
  if (!member) return res.status(403).json({ message: 'Not a member' });

  const members = await roomRepo.getRoomMembers(roomId);
  res.json(members);
};

const leaveRoom = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const result = await roomRepo.leaveRoom(roomId, userId);
  if (!result) return res.status(404).json({ message: 'Room not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: 'You have left the room' });
};

// --- subject rooms ---

const getSubjectRoomsForUser = async (req, res) => {
  const userId = req.user.id;

  // get user's majors from user_majors table
  const result = await require('../db').query(
    `SELECT m.id, m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1`,
    [userId]
  );
  const userMajors = result.rows; // [{ id, name }]

  if (userMajors.length === 0) return res.json([]);

  const majorIds = userMajors.map(m => m.id);

  // get all subject rooms for those majors
  const roomsResult = await require('../db').query(
    `SELECT r.*, rm.user_id as joined_by FROM rooms r
     LEFT JOIN room_members rm ON rm.room_id = r.id AND rm.user_id = $1
     WHERE r.type = 'subject' AND r.major_id = ANY($2::uuid[])`,
    [userId, majorIds]
  );
  const subjectRooms = roomsResult.rows;

  const response = userMajors.map(major => {
    const majorRooms = subjectRooms.filter(r => r.major_id === major.id);
    const joinedRooms = majorRooms.filter(r => r.joined_by !== null);
    const existingSubjects = majorRooms.map(r => r.name);
    const allSubjects = subjectsMap[major.name] || [];
    const availableSubjects = allSubjects.filter(s => !existingSubjects.includes(s));

    return {
      major: major.name,
      majorId: major.id,
      rooms: joinedRooms,
      available: availableSubjects,
    };
  });

  res.json(response);
};

const joinSubjectRoom = async (req, res) => {
  const userId = req.user.id;
  const { roomId } = req.params;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.type !== 'subject') return res.status(400).json({ message: 'Not a subject room' });

  // check user is enrolled in this major
  const majorCheck = await require('../db').query(
    `SELECT 1 FROM user_majors WHERE user_id = $1 AND major_id = $2`,
    [userId, room.major_id]
  );
  if (majorCheck.rows.length === 0) {
    return res.status(403).json({ message: 'You are not enrolled in this major' });
  }

  const alreadyMember = await roomRepo.isMember(roomId, userId);
  if (alreadyMember) return res.status(400).json({ message: 'Already joined' });

  await roomRepo.addMember(roomId, userId);

  const user = await userRepo.findById(userId);
  try {
    await sendRoomInviteEmail(user.email, user.username, room.name, 'the platform');
  } catch (err) {
    console.error('Failed to send join email:', err);
  }

  res.json({ message: 'Joined successfully' });
};

const leaveSubjectRoom = async (req, res) => {
  const userId = req.user.id;
  const { roomId } = req.params;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const result = await roomRepo.leaveRoom(roomId, userId);
  if (result?.error) return res.status(400).json({ message: result.error });

  res.json({ message: 'Left room successfully' });
};

const createSubjectRoom = async (req, res) => {
  const userId = req.user.id;
  const { majorId, subject } = req.body;

  // verify user is enrolled in this major
  const majorCheck = await require('../db').query(
    `SELECT m.name FROM user_majors um
     JOIN majors m ON m.id = um.major_id
     WHERE um.user_id = $1 AND um.major_id = $2`,
    [userId, majorId]
  );
  if (majorCheck.rows.length === 0) {
    return res.status(403).json({ message: 'You are not enrolled in this major' });
  }

  const majorName = majorCheck.rows[0].name;
  const validSubjects = subjectsMap[majorName] || [];
  if (!validSubjects.includes(subject)) {
    return res.status(400).json({ message: 'Invalid subject for this major' });
  }

  // check if room already exists
  const existing = await require('../db').query(
    `SELECT * FROM rooms WHERE type = 'subject' AND major_id = $1 AND name = $2`,
    [majorId, subject]
  );

  if (existing.rows.length > 0) {
    const existingRoom = existing.rows[0];
    await roomRepo.addMember(existingRoom.id, userId);
    return res.json({ message: 'Joined existing room', room: existingRoom });
  }

  const room = await roomRepo.createRoom({
    name: subject,
    type: 'subject',
    majorId,
    createdBy: null,
  });

  await roomRepo.addMember(room.id, userId);
  res.status(201).json({ message: 'Room created and joined', room });
};

module.exports = {
  getMyRooms,
  getPublicRooms,
  createPrivateRoom,
  joinPrivateRoom,
  deletePrivateRoom,
  renamePrivateRoom,
  upgradeToAdmin,
  getRoomById,
  getRoomMembers,
  leaveRoom,
  getSubjectRoomsForUser,
  joinSubjectRoom,
  leaveSubjectRoom,
  createSubjectRoom,
};