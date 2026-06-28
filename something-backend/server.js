// // server.js
// const express = require("express");
// const cors = require("cors");

// const app = express();
// const PORT = 5000;

// // Middleware
// app.use(cors()); // allows frontend to talk to backend
// app.use(express.json()); // parses incoming JSON automatically

// // Test route
// app.get("/", (req, res) => {
//   res.send("ITS ALIVE...ITS ALIIIIVE!");
// });

// // Example register route
// let users = [];

// app.post("/register", (req, res) => {
//   const profile = {
//     ...req.body,
//     isVerified: false,
//     admin: false
//   };

//   users.push(profile);

//   console.log("New user registered:", profile);
//   res.json({ message: "User registered successfully", user: profile });
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// require("dotenv").config();
// const app = require("./app");
 
// const PORT = process.env.PORT || 5000;
// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "ok" });
// });
// app.listen(PORT,"0.0.0.0", () => {
//   console.log(`Server running on port ${PORT}`);
// });          

require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// make io accessible in controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});