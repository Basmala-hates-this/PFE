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


const removeMember = async (req, res) => {
  const { roomId, memberId } = req.params;
  const userId = req.user.id;
 
  // verify requester is an admin of this room
  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (!room.admins?.includes(userId))
    return res.status(403).json({ message: 'Only room admins can remove members' });

  // can't remove another admin
  if (room.admins?.includes(memberId))
    return res.status(403).json({ message: 'Cannot remove another admin' });

  const result = await roomRepo.removeMember(roomId, memberId);
  if (result?.error) return res.status(400).json({ message: result.error });

  res.json({ message: 'Member removed successfully' });
};


const kickMember = async (req, res) => {
  const { roomId, memberId } = req.params;
  const userId = req.user.id;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  // only admins can kick
  if (!room.admins?.includes(userId))
    return res.status(403).json({ message: 'Only room admins can remove members' });

  // can't kick another admin
  if (room.admins?.includes(parseInt(memberId)))
    return res.status(403).json({ message: 'Cannot remove another admin' });

  // can't kick yourself (that's what leaveRoom is for)
  if (userId === parseInt(memberId))
    return res.status(400).json({ message: 'Use leave room instead' });

  const isMember = await roomRepo.isMember(roomId, memberId);
  if (!isMember) return res.status(404).json({ message: 'User is not a member of this room' });

  await roomRepo.removeMember(roomId, memberId);
  res.json({ message: 'Member removed successfully' });
};


const inviteMember = async (req, res) => {
  const { roomId } = req.params;
  const { userId: inviteeId } = req.body;
  const userId = req.user.id;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  // only admins can invite
  if (!room.admins?.includes(userId))
    return res.status(403).json({ message: 'Only admins can invite members' });

  const alreadyMember = await roomRepo.isMember(roomId, inviteeId);
  if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

  const count = await roomRepo.getMemberCount(roomId);
  if (count >= room.memberLimit) return res.status(400).json({ message: 'Room is full' });

  await roomRepo.addMember(roomId, inviteeId);
  res.json({ message: 'Member added successfully' });
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
  removeMember,
  kickMember,
  inviteMember,
};