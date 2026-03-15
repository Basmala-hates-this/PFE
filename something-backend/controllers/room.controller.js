const roomRepo = require("../repositories/room.repo");
const userRepo = require("../repositories/user.repo");


const getMyRooms = (req, res) => {
  const userId = req.user.id;
  const user = userRepo.findById(userId);
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const userRooms = roomRepo.getRoomsByIds(user.rooms);
  res.json(userRooms);
};

module.exports = {
  getMyRooms,      
};