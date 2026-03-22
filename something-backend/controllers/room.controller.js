const roomRepo = require("../repositories/room.repo");
const userRepo = require("../repositories/user.repo");


const getMyRooms = (req, res) => {
  const userId = req.user.id;
  const user = userRepo.findById(userId);
  
  console.log("userId:", userId);
  console.log("user.rooms:", user?.rooms);
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const userRooms = roomRepo.getRoomsByIds(user.rooms);
  //  console.log("userRooms found:", userRooms.length);
  //who knew that console.log would freez the terminal and stop the app
  
  res.json(userRooms);
};

const getPublicRooms = (req, res) => {
  const rooms = roomRepo.getAllRooms();
  const publicRooms = rooms.filter(r => r.type === "public" || r.type === "university");
  res.json(publicRooms);
};



///private room managment shit
const createPrivateRoom = (req, res) => {
  const { name, passKey } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  const finalPassKey = passKey || roomRepo.generatePassKey();

  const room = roomRepo.createRoom({
    name,
    type: "private",
    isPrivate: true,
    passKey: finalPassKey,
    createdBy: userId,
  });

  // add creator as first member and admin
  roomRepo.addMember(room.id, userId);
  roomRepo.addRoomAdmin(room.id, userId);

  // add room to user's rooms
  const userRepo = require("../repositories/user.repo");
  const user = userRepo.findById(userId);
  userRepo.updateUser(userId, { rooms: [...(user.rooms || []), room.id] });

  res.status(201).json(room);
};

const joinPrivateRoom = (req, res) => {
  const { passKey } = req.body;
  const userId = req.user.id;

  const result = roomRepo.joinRoomByPassKey(passKey, userId);

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  // add room to user's rooms
  const userRepo = require("../repositories/user.repo");
  const user = userRepo.findById(userId);
  userRepo.updateUser(userId, { rooms: [...(user.rooms || []), result.room.id] });

  res.json({ message: `Welcome to ${result.room.name}!`, room: result.room });
};

const deletePrivateRoom = (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const result = roomRepo.deleteRoom(roomId, userId);
  if (!result) return res.status(404).json({ message: "Room not found" });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: "Room deleted" });
};

const renamePrivateRoom = (req, res) => {
  const { roomId } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  const result = roomRepo.renameRoom(roomId, userId, name);
  if (!result) return res.status(404).json({ message: "Room not found" });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json(result);
};

const upgradeToAdmin = (req, res) => {
  const { roomId, memberId } = req.params;
  const userId = req.user.id;

  const result = roomRepo.addRoomAdmin(roomId, memberId, userId);
  if (!result) return res.status(404).json({ message: "Room not found" });
  if (result.error) return res.status(403).json({ message: result.error });

  res.json({ message: "Member upgraded to admin" });
};



const getRoomById = (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;
  
  const room = roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: "Room not found" });
  if (!room.members.includes(userId)) {
    return res.status(403).json({ message: "You are not a member of this room" });
  }
  
  res.json(room);
};



//names better then ids.....
const getRoomMembers = (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const room = roomRepo.getRoomById(roomId);
  if (!room) return res.status(404).json({ message: "Room not found" });
  if (!room.members.includes(userId)) {
    return res.status(403).json({ message: "Not a member" });
  }

  const userRepo = require("../repositories/user.repo");
  const members = room.members.map(memberId => {
    const user = userRepo.findById(memberId);
    return { id: memberId, username: user?.username || "Unknown" };
  });

  res.json(members);
};


const leaveRoom = (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  const result = roomRepo.leaveRoom(roomId, userId);
  if (!result) return res.status(404).json({ message: "Room not found" });
  if (result.error) return res.status(403).json({ message: result.error });

  // remove room from user's rooms list
  const userRepo = require("../repositories/user.repo");
  const user = userRepo.findById(userId);
  userRepo.updateUser(userId, { rooms: user.rooms.filter(id => id !== roomId) });

  res.json({ message: "You have left the room" });
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

};