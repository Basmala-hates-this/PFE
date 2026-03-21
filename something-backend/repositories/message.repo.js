const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "../data/messages.json");

const readMessages = () => {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

const writeMessages = (messagesList) => {
  fs.writeFileSync(filePath, JSON.stringify(messagesList));
};

const getMessagesByRoom = (roomId) => {
  const messages = readMessages();
  return messages.filter((m) => m.roomId === roomId);
};

const createMessage = (messageData) => {
  const messages = readMessages();
  const newMessage = {
    id: Date.now().toString(),
    roomId: messageData.roomId,
    authorId: messageData.authorId,
    authorUsername: messageData.authorUsername,
    content: messageData.content,
    attachment: messageData.attachment || null,
    replyTo: messageData.replyTo || null,
    createdAt: new Date().toISOString(),
    isEdited: false,
  };
  messages.push(newMessage);
  writeMessages(messages);
  return newMessage;
};

const deleteMessage = (messageId, userId) => {
  const messages = readMessages();
  const index = messages.findIndex((m) => m.id === messageId);
  if (index === -1) return null;
  if (messages[index].authorId !== userId) return { error: "Not authorized" };
  messages.splice(index, 1);
  writeMessages(messages);
  return true;
};

const editMessage = (messageId, userId, newContent) => {
  const messages = readMessages();
  const message = messages.find((m) => m.id === messageId);
  if (!message) return null;
  if (message.authorId !== userId) return { error: "Not authorized" };
  message.content = newContent;
  message.isEdited = true;
  writeMessages(messages);
  return message;
};

module.exports = {
  getMessagesByRoom,
  createMessage,
  deleteMessage,
  editMessage,
};