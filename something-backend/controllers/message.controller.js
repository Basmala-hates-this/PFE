// const messageRepo = require("../repositories/message.repo");
// const roomRepo = require("../repositories/room.repo");

// const getMessages = (req, res) => {
//   const { roomId } = req.params;
//   const userId = req.user.id;

//   const room = roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: "Room not found" });
//   if (!room.members.includes(userId)) {
//     return res.status(403).json({ message: "You are not a member of this room" });
//   }

//   const messages = messageRepo.getMessagesByRoom(roomId);
//   res.json(messages);
// };

// const sendMessage = (req, res) => {
//   const { roomId } = req.params;
//   const { content, replyTo } = req.body;
//   const userId = req.user.id;
//   const authorUsername = req.user.username;

//   const room = roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: "Room not found" });
//   if (!room.members.includes(userId)) {
//     return res.status(403).json({ message: "You are not a member of this room" });
//   }

//   const attachment = req.file
//     ? `http://localhost:5000/uploads/${req.file.filename}`
//     : null;

//   const message = messageRepo.createMessage({
//     roomId,
//     authorId: userId,
//     authorUsername,
//     content,
//     attachment,
//     replyTo: replyTo || null,
//   });

//   res.status(201).json(message);
// };

// const deleteMessage = (req, res) => {
//   const { messageId } = req.params;
//   const userId = req.user.id;

//   const result = messageRepo.deleteMessage(messageId, userId);
//   if (!result) return res.status(404).json({ message: "Message not found" });
//   if (result.error) return res.status(403).json({ message: result.error });
//   res.json({ message: "Message deleted" });
// };

// const editMessage = (req, res) => {
//   const { messageId } = req.params;
//   const { content } = req.body;
//   const userId = req.user.id;

//   const result = messageRepo.editMessage(messageId, userId, content);
//   if (!result) return res.status(404).json({ message: "Message not found" });
//   if (result.error) return res.status(403).json({ message: result.error });
//   res.json(result);
// };

// module.exports = {
//   getMessages,
//   sendMessage,
//   deleteMessage,
//   editMessage,
// };

const messageRepo = require('../repositories/message.repo');
const roomRepo = require('../repositories/room.repo');

const getMessages = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const member = await roomRepo.isMember(roomId, userId);
  if (!member) return res.status(403).json({ message: 'You are not a member of this room' });

  const messages = await messageRepo.getMessagesByRoom(roomId);
  res.json(messages);
};

const sendMessage = async (req, res) => {
  const { roomId } = req.params;
  const { content, replyTo } = req.body;
  const userId = req.user.id;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const member = await roomRepo.isMember(roomId, userId);
  if (!member) return res.status(403).json({ message: 'You are not a member of this room' });

  const attachment = req.file
    ? `http://localhost:5000/uploads/${req.file.filename}`
    : null;

  const message = await messageRepo.createMessage({
    roomId,
    authorId: userId,
    content,
    attachment,
    replyTo: replyTo || null,
  });

  res.status(201).json(message);
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const result = await messageRepo.deleteMessage(messageId, userId);
  if (!result) return res.status(404).json({ message: 'Message not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: 'Message deleted' });
};

const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const result = await messageRepo.editMessage(messageId, userId, content);
  if (!result) return res.status(404).json({ message: 'Message not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json(result);
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
};