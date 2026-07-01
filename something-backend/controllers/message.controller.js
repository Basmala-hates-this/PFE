const messageRepo = require('../repositories/message.repo');
const roomRepo = require('../repositories/room.repo');
const notifService = require('../services/notificationService'); 

// const getMessages = async (req, res) => {
//   const { roomId } = req.params;
//   const userId = req.user.id;

//   const room = await roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: 'Room not found' });

//   const member = await roomRepo.isMember(roomId, userId);
//   if (!member) return res.status(403).json({ message: 'You are not a member of this room' });

//   const messages = await messageRepo.getMessagesByRoom(roomId);
//   res.json(messages);
// };
const getMessages = async (req, res) => {
  const { roomId } = req.params;
  const { limit = 20, cursorCreatedAt, cursorId } = req.query;
  const userId = req.user.id;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const member = await roomRepo.isMember(roomId, userId);
  if (!member) return res.status(403).json({ message: 'You are not a member of this room' });

  const { messages, nextCursor } = await messageRepo.getMessagesByRoom(roomId, {
    limit: Number(limit),
    cursorCreatedAt: cursorCreatedAt || null,
    cursorId: cursorId ? Number(cursorId) : null,
  });

  res.json({ messages, nextCursor, hasMore: !!nextCursor });
};

// const sendMessage = async (req, res) => {
//   const { roomId } = req.params;
//   const { content, replyTo } = req.body;
//   const userId = req.user.id;

//   const room = await roomRepo.getRoomById(roomId);
//   if (!room) return res.status(404).json({ message: 'Room not found' });

//   const member = await roomRepo.isMember(roomId, userId);
//   if (!member) return res.status(403).json({ message: 'You are not a member of this room' });

//   // const attachment = req.file
//   //   ? `http://localhost:5000/uploads/${req.file.filename}`
//   //   : null;
//   // const attachment = req.file
//   // ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}`
//   // : null;

//   const attachment = req.file ? req.file.path : null;
  
//   const message = await messageRepo.createMessage({
//     roomId,
//     authorId: userId,
//     content,
//     attachment,
//     replyTo: replyTo || null,
//   });
//     try {
//   await notifService.notifyNewMessage(roomId, userId, req.user.username, room.name, message.id);
// } catch (notifErr) {
//   console.error('Notification failed:', notifErr);
// }

//   res.status(201).json(message);
// };

// const deleteMessage = async (req, res) => {
//   const { messageId } = req.params;
//   const userId = req.user.id;

//   const result = await messageRepo.deleteMessage(messageId, userId);
//   if (!result) return res.status(404).json({ message: 'Message not found' });
//   if (result.error) return res.status(403).json({ message: result.error });

//   res.json({ message: 'Message deleted' });
// };

// const editMessage = async (req, res) => {
//   const { messageId } = req.params;
//   const { content } = req.body;
//   const userId = req.user.id;

//   const result = await messageRepo.editMessage(messageId, userId, content);
//   if (!result) return res.status(404).json({ message: 'Message not found' });
//   if (result.error) return res.status(403).json({ message: result.error });

//   res.json(result);
// };
const sendMessage = async (req, res) => {
  const { roomId } = req.params;
  const { content, replyTo } = req.body;
  const userId = req.user.id;

  const room = await roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  const member = await roomRepo.isMember(roomId, userId);
  if (!member) return res.status(403).json({ message: 'You are not a member of this room' });

  const attachment = req.file ? req.file.path : null;

  const message = await messageRepo.createMessage({
    roomId,
    authorId: userId,
    content,
    attachment,
    replyTo: replyTo || null,
  });

  // emit to everyone in the room
  const io = req.app.get("io");
  io.to(roomId).emit("new_message", message);

  try {
    await notifService.notifyNewMessage(roomId, userId, req.user.username, room.name, message.id);
  } catch (notifErr) {
    console.error('Notification failed:', notifErr);
  }

  res.status(201).json(message);
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const result = await messageRepo.deleteMessage(messageId, userId);
  if (!result) return res.status(404).json({ message: 'Message not found' });
  if (result.error) return res.status(403).json({ message: result.error });
  

  // emit delete to room — but we need roomId, get it from the message before deleting
  // message.repo.deleteMessage should return the deleted message's roomId
  const io = req.app.get("io");
  if (result.roomId) io.to(result.roomId).emit("message_deleted", messageId);

  res.json({ message: 'Message deleted' });
};

const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const result = await messageRepo.editMessage(messageId, userId, content);
  if (!result) return res.status(404).json({ message: 'Message not found' });
  if (result.error) return res.status(403).json({ message: result.error });

  const io = req.app.get("io");
  if (result.roomId) io.to(result.roomId).emit("message_edited", result);

  res.json(result);
};

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
  editMessage,
};