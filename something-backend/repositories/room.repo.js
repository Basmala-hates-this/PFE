const fs = require("fs");//to connect to the json file(aka false database)
const path = require("path");
const filePath = path.join(__dirname, "../data/rooms.json");

const readRooms = () => {
    const data =fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
};


const writeRooms = (roomsList) => {
    fs.writeFileSync(filePath, JSON.stringify(roomsList));
};

const createRoom = (roomData) => {
    const rooms = readRooms();
    const newRoom ={
        id: Date.now().toString(),
        name: roomData.name,
        type: roomData.type,
        university: roomData.university || null,
        major: roomData.major || null,
        createdBy: roomData.createdBy || "system",
        isPrivate: roomData.isPrivate || false,
        passKey: roomData.passKey || null,
        members: [],
        createdAt: new Date().toISOString()
    };

    rooms.push(newRoom);
    writeRooms(rooms);
    return newRoom;
};

const getRoomById = (id) => {
    const rooms = readRooms();
    return rooms.find((r) => r.id === id);
}

const getRoomsByType = (type, filter) => {
    const rooms = readRooms();
    return rooms.filter((r) => r.type === type && (!filter || (r.university === filter || r.major === filter)));
};

const addMember = (roomId, userId) => {
    const rooms = readRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return null;
    if (!room.members.includes(userId)) {
        room.members.push(userId);
        writeRooms(rooms);
    }
    return room;
};

const getRoomsByIds = (ids) => {
  const rooms = readRooms();
  return rooms.filter((r) => ids.includes(r.id));
};


const getAllRooms = () => {
  return readRooms();
};



//private room necisseties//i'm pretty sure i butchred that word...
const generatePassKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


const joinRoomByPassKey = (passKey, userId) => {
  const rooms = readRooms();
  const room = rooms.find((r) => r.passKey === passKey);
  
  if (!room) return { error: "Invalid passkey" };
  if (room.members.includes(userId)) return { error: "Already joined" };
  if (room.members.length >= 200) return { error: "Room full" };
  
  room.members.push(userId);
  writeRooms(rooms);
  return { success: true, room };
};

module.exports = {
    createRoom,
    getRoomById,
    getRoomsByType,
    addMember,
    getRoomsByIds,
    getAllRooms,
    generatePassKey,
    joinRoomByPassKey,
    
}

