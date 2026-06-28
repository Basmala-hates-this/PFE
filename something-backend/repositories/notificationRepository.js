const db = require('../db');
const  toCamel = require('../utils/toCamel');
const NOTIF_TYPES = require('../constants/notifTypes');

const createNotification = async ({ userId, type, title, body, entityType, entityId, roomId }) => {
  const { rows } = await db.query(
    `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, room_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, type, title, body, entityType || null, entityId || null, roomId || null]
  );
  return toCamel(rows[0]);
};

const getUnreadCount = async (userId) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt(rows[0].count);
};

const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  const { rows } = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows.map(toCamel);
};

const markAsRead = async (notificationId, userId) => {
  await db.query(
    `UPDATE notifications SET is_read = true
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
};

const markAllAsRead = async (userId) => {
  await db.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1`,
    [userId]
  );
};

// fanout: notify all room members except the sender
const createRoomNotifications = async ({ roomId, excludeUserId, type, title, body, entityType, entityId }) => {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id, room_id)
     SELECT rm.user_id, $1, $2, $3, $4, $5, $6
     FROM room_members rm
     WHERE rm.room_id = $7 AND rm.user_id != $8`,
    [type, title, body, entityType || null, entityId || null, roomId, roomId, excludeUserId]
//   $1    $2    $3   $4                   $5                 $6      $7      $8
  );
};

module.exports = {
  createNotification,
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  createRoomNotifications,
};