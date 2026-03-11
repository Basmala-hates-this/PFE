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

module.exports = {
    createRoom,
    getRoomById,
    getRoomsByType,
    addMember,
}

