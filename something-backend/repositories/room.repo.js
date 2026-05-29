// //screw writing function names that actuallu make sense but are ridiculously long...

const toCamel = require('../utils/toCamel');

const pool = require('../db');

const createRoom = async (roomData) => {
  const {
    name,
    type,
    universityCode = null,
    majorId = null,
    isPrivate = false,
    passKey = null,
    memberLimit = 200,
    createdBy = null,
  } = roomData;

  const result = await pool.query(
    `INSERT INTO rooms (name, type, university_code, major_id, is_private, pass_key, member_limit, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [name, type, universityCode, majorId, isPrivate, passKey, memberLimit, createdBy]
  );

  return toCamel(result.rows[0]);
};

const getRoomById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM rooms WHERE id = $1`,
    [id]
  );
  if (!result.rows[0]) return null;

  const room = toCamel(result.rows[0]);

  // fetch admins for this room
  const adminsResult = await pool.query(
    `SELECT user_id FROM room_members WHERE room_id = $1 AND role = 'admin'`,
    [id]
  );
  room.admins = adminsResult.rows.map(r => r.user_id);

  // fetch member count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM room_members WHERE room_id = $1`,
    [id]
  );
  room.members = { length: parseInt(countResult.rows[0].count) };

  return room;
};

const getAllRooms = async () => {
  const result = await pool.query(`SELECT * FROM rooms`);
  return toCamel(result.rows);
};

const getRoomsByType = async (type, filter = null) => {
  if (!filter) {
    const result = await pool.query(
      `SELECT * FROM rooms WHERE type = $1`,
      [type]
    );
    return toCamel(result.rows); 
  }

  const result = await pool.query(
    `SELECT * FROM rooms WHERE type = $1 AND (university_code = $2 OR major_id::text = $2)`,
    [type, filter]
  );
  return result.rows;
};

const getRoomsByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const result = await pool.query(
    `SELECT * FROM rooms WHERE id = ANY($1::uuid[])`,
    [ids]
  );
 return toCamel(result.rows);
};

// --- members ---

const addMember = async (roomId, userId, role = 'member') => {
  try {
    await pool.query(
      `INSERT INTO room_members (room_id, user_id, role) VALUES ($1,$2,$3)
       ON CONFLICT (room_id, user_id) DO NOTHING`,
      [roomId, userId, role]
    );
    return toCamel(await getRoomById(roomId));
  } catch (err) {
    throw err;
  }
};

const removeMember = async (roomId, userId) => {
  await pool.query(
    `DELETE FROM room_members WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  );
};

const getRoomMembers = async (roomId) => {
  const result = await pool.query(
    `SELECT u.id, u.username, rm.role
     FROM room_members rm
     JOIN users u ON u.id = rm.user_id
     WHERE rm.room_id = $1`,
    [roomId]
  );
  return toCamel(result.rows);
};

const isMember = async (roomId, userId) => {
  const result = await pool.query(
    `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  );
  return result.rows.length > 0;
};

const isAdmin = async (roomId, userId) => {
  const result = await pool.query(
    `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2 AND role = 'admin'`,
    [roomId, userId]
  );
  return result.rows.length > 0;
};

const getMemberCount = async (roomId) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM room_members WHERE room_id = $1`,
    [roomId]
  );
  return parseInt(result.rows[0].count);
};

const getUserRooms = async (userId) => {
  const result = await pool.query(
    `SELECT r.* FROM rooms r
     JOIN room_members rm ON rm.room_id = r.id
     WHERE rm.user_id = $1`,
    [userId]
  );
  return toCamel(result.rows);
};

// --- private room ---

const generatePassKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const joinRoomByPassKey = async (passKey, userId) => {
  const roomResult = await pool.query(
    `SELECT * FROM rooms WHERE pass_key = $1`,
    [passKey]
  );
  const room = roomResult.rows[0];

  if (!room) return { error: 'Invalid passkey' };

  const alreadyMember = await isMember(room.id, userId);
  if (alreadyMember) return { error: 'Already joined' };

  const count = await getMemberCount(room.id);
  if (count >= room.member_limit) return { error: 'Room full' };

  await addMember(room.id, userId);
 return { success: true, room: toCamel(room) };
};

const addRoomAdmin = async (roomId, memberId, requesterId = null) => {
  if (requesterId) {
    const requesterIsAdmin = await isAdmin(roomId, requesterId);
    if (!requesterIsAdmin) return { error: 'Not authorized' };
  }

  await pool.query(
    `UPDATE room_members SET role = 'admin' WHERE room_id = $1 AND user_id = $2`,
    [roomId, memberId]
  );

  return toCamel(await getRoomById(roomId));
};

const deleteRoom = async (roomId, userId) => {
  const room = await getRoomById(roomId);
  if (!room) return null;

  const requesterIsAdmin = await isAdmin(roomId, userId);
  if (room.createdBy !== userId && !requesterIsAdmin) {
    return { error: 'Not authorized' };
  }

  await pool.query(`DELETE FROM rooms WHERE id = $1`, [roomId]);
  return true;
};

const renameRoom = async (roomId, userId, newName) => {
  const room = await getRoomById(roomId);
  if (!room) return null;

  const requesterIsAdmin = await isAdmin(roomId, userId);
  if (room.createdBy !== userId && !requesterIsAdmin) {
    return { error: 'Not authorized' };
  }

  const result = await pool.query(
    `UPDATE rooms SET name = $1 WHERE id = $2 RETURNING *`,
    [newName, roomId]
  );
  return toCamel(result.rows[0]);
};

const leaveRoom = async (roomId, userId) => {
  const member = await isMember(roomId, userId);
  if (!member) return { error: 'Not a member' };

  const room = await getRoomById(roomId);

  // if creator wants to leave, check for another admin
 if (room.createdBy === userId) {
    const result = await pool.query(
      `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id != $2 AND role = 'admin'`,
      [roomId, userId]
    );
    if (result.rows.length === 0) {
      return { error: 'You must promote another member to admin or delete the room before leaving' };
    }
  }

  await removeMember(roomId, userId);
  return { success: true };
};

// --- suspensions ---

const suspendMemberFromRoom = async (roomId, userId, until, reason) => {
  await pool.query(
    `INSERT INTO room_suspensions (room_id, user_id, suspended_until, reason)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (room_id, user_id) DO UPDATE
     SET suspended_until = $3, reason = $4`,
    [roomId, userId, until, reason]
  );
  return toCamel(await getRoomById(roomId));
};

const unsuspendMemberFromRoom = async (roomId, userId) => {
  await pool.query(
    `DELETE FROM room_suspensions WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  );
  return toCamel(await getRoomById(roomId));
};

const getRoomSuspension = async (roomId, userId) => {
  const result = await pool.query(
    `SELECT * FROM room_suspensions WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId]
  );
 return toCamel(result.rows[0]) || null;
};



module.exports = {
  createRoom,
  getRoomById,
  getAllRooms,
  getRoomsByType,
  getRoomsByIds,
  addMember,
  removeMember,
  getRoomMembers,
  isMember,
  isAdmin,
  getMemberCount,
  getUserRooms,
  generatePassKey,
  joinRoomByPassKey,
  addRoomAdmin,
  deleteRoom,
  renameRoom,
  leaveRoom,
  suspendMemberFromRoom,
  unsuspendMemberFromRoom,
  getRoomSuspension,
};