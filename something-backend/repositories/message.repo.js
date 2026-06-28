const toCamel = require('../utils/toCamel');

const pool = require('../db');

const getMessagesByRoom = async (roomId) => {
  const result = await pool.query(
    `SELECT m.*, u.username as author_username
     FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.room_id = $1
     ORDER BY m.created_at ASC`,
    [roomId]
  );
  return toCamel(result.rows);
};

const createMessage = async (messageData) => {
  const result = await pool.query(
    `INSERT INTO messages (room_id, sender_id, content, attachment, reply_to)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      messageData.roomId,
      messageData.authorId,
      messageData.content,
      messageData.attachment || null,
      messageData.replyTo || null,
    ]
  );
  return toCamel(result.rows[0]);
};

// const deleteMessage = async (messageId, userId) => {
//   const existing = await pool.query(
//     `SELECT * FROM messages WHERE id = $1`,
//     [messageId]
//   );
//   const message = existing.rows[0];
//   if (!message) return null;
//   if (message.sender_id !== userId) return { error: 'Not authorized' };

//   await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId]);
//   return true;
// };

const deleteMessage = async (messageId, userId) => {
  const existing = await pool.query(
    `SELECT * FROM messages WHERE id = $1`,
    [messageId]
  );
  const message = existing.rows[0];
  if (!message) return null;
  if (message.sender_id !== userId) return { error: 'Not authorized' };

  await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId]);
  return { deleted: true, roomId: message.room_id }; // return roomId
};

const editMessage = async (messageId, userId, newContent) => {
  const existing = await pool.query(
    `SELECT * FROM messages WHERE id = $1`,
    [messageId]
  );
  const message = existing.rows[0];
  if (!message) return null;
  if (message.sender_id !== userId) return { error: 'Not authorized' };

  // const result = await pool.query(
  //   `UPDATE messages SET content = $1 WHERE id = $2 RETURNING *`,
  //   [newContent, messageId]
  // );
  // return toCamel(result.rows[0]);
   const result = await pool.query(
    `UPDATE messages SET content = $1 WHERE id = $2 RETURNING *, room_id as "roomId"`,
    [newContent, messageId]
  );
  return toCamel(result.rows[0]);
};

module.exports = {
  getMessagesByRoom,
  createMessage,
  deleteMessage,
  editMessage,
};