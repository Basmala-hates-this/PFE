// const fs = require("fs");
// const path = require("path");
// const filePath = path.join(__dirname, "../data/messages.json");

// const readMessages = () => {
//   const data = fs.readFileSync(filePath, "utf8");
//   return JSON.parse(data);
// };

// const writeMessages = (messagesList) => {
//   fs.writeFileSync(filePath, JSON.stringify(messagesList));
// };

// const getMessagesByRoom = (roomId) => {
//   const messages = readMessages();
//   return messages.filter((m) => m.roomId === roomId);
// };

// const createMessage = (messageData) => {
//   const messages = readMessages();
//   const newMessage = {
//     id: Date.now().toString(),
//     roomId: messageData.roomId,
//     authorId: messageData.authorId,
//     authorUsername: messageData.authorUsername,
//     content: messageData.content,
//     attachment: messageData.attachment || null,
//     replyTo: messageData.replyTo || null,
//     createdAt: new Date().toISOString(),
//     isEdited: false,
//   };
//   messages.push(newMessage);
//   writeMessages(messages);
//   return newMessage;
// };

// const deleteMessage = (messageId, userId) => {
//   const messages = readMessages();
//   const index = messages.findIndex((m) => m.id === messageId);
//   if (index === -1) return null;
//   if (messages[index].authorId !== userId) return { error: "Not authorized" };
//   messages.splice(index, 1);
//   writeMessages(messages);
//   return true;
// };

// const editMessage = (messageId, userId, newContent) => {
//   const messages = readMessages();
//   const message = messages.find((m) => m.id === messageId);
//   if (!message) return null;
//   if (message.authorId !== userId) return { error: "Not authorized" };
//   message.content = newContent;
//   message.isEdited = true;
//   writeMessages(messages);
//   return message;
// };

// module.exports = {
//   getMessagesByRoom,
//   createMessage,
//   deleteMessage,
//   editMessage,
// };


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

const deleteMessage = async (messageId, userId) => {
  const existing = await pool.query(
    `SELECT * FROM messages WHERE id = $1`,
    [messageId]
  );
  const message = existing.rows[0];
  if (!message) return null;
  if (message.sender_id !== userId) return { error: 'Not authorized' };

  await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId]);
  return true;
};

const editMessage = async (messageId, userId, newContent) => {
  const existing = await pool.query(
    `SELECT * FROM messages WHERE id = $1`,
    [messageId]
  );
  const message = existing.rows[0];
  if (!message) return null;
  if (message.sender_id !== userId) return { error: 'Not authorized' };

  const result = await pool.query(
    `UPDATE messages SET content = $1 WHERE id = $2 RETURNING *`,
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