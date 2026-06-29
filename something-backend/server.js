       

// require("dotenv").config();
// const http = require("http");
// const { Server } = require("socket.io");
// const app = require("./app");

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "*",
//     methods: ["GET", "POST"]
//   }
// });

// // make io accessible in controllers
// app.set("io", io);

// io.on("connection", (socket) => {
//   console.log("Socket connected:", socket.id);

//   socket.on("join_room", (roomId) => {
//     socket.join(roomId);
//     console.log(`Socket ${socket.id} joined room ${roomId}`);
//   });

//   socket.on("leave_room", (roomId) => {
//     socket.leave(roomId);
//   });

//   socket.on("disconnect", () => {
//     console.log("Socket disconnected:", socket.id);
//   });
// });

// app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// server.listen(PORT, "0.0.0.0", () => {
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
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

const activeCalls = new Map();
const socketMeta = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    if (activeCalls.has(roomId)) {
      const call = activeCalls.get(roomId);
      socket.emit("call:active", {
        roomId,
        hostId: call.hostId,
        participantCount: call.participants.size,
      });
    }
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
  });

  // ─── host starts call ─────────────────────────────────────────────────
  socket.on("call:start", ({ roomId, userId, displayName }) => {
    socketMeta.set(socket.id, { userId, roomId, displayName });

    if (activeCalls.has(roomId)) {
      socket.emit("call:error", { message: "A call is already active in this room." });
      return;
    }

    activeCalls.set(roomId, {
      hostId: userId,
      hostSocketId: socket.id,
      participants: new Map([[socket.id, { userId, displayName }]]),
      audience: new Set(),
      active: true,
      mode: "p2p",
    });

    socket.join(`call:${roomId}`);

    socket.to(roomId).emit("call:incoming", {
      roomId,
      hostId: userId,
      hostName: displayName,
    });

    socket.emit("call:started", { roomId, mode: "p2p" });
    console.log(`Call started in room ${roomId} by ${userId}`);
  });

  // ─── user joins as audience ───────────────────────────────────────────
  socket.on("call:join_audience", ({ roomId, userId, displayName }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    socketMeta.set(socket.id, { userId, roomId, displayName });
    call.audience.add(socket.id);
    socket.join(`call:${roomId}`);

    // ← tell the HOST specifically, with the joiner's socketId
    io.to(call.hostSocketId).emit("call:audience_joined", {
      userId,
      displayName,
      socketId: socket.id,
    });

    const participantList = [...call.participants.values()];
    socket.emit("call:state", {
      roomId,
      mode: call.mode,
      hostId: call.hostId,
      participants: participantList,
    });
  });

  // ─── host invites someone to speak ───────────────────────────────────
  socket.on("call:invite_speaker", ({ roomId, targetSocketId }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    const meta = socketMeta.get(socket.id);
    if (!meta || meta.userId !== call.hostId) {
      socket.emit("call:error", { message: "Only the host can invite speakers." });
      return;
    }

    // ← use targetSocketId directly instead of searching by userId
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:speaker_invite", {
        roomId,
        fromHostId: call.hostId,
      });
    }
  });

  // ─── guest accepts speaker invite ─────────────────────────────────────
  socket.on("call:accept_speaker", ({ roomId, userId, displayName }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    if (call.participants.size >= 4) {
      socket.emit("call:error", { message: "Max 4 speakers reached." });
      return;
    }

    call.audience.delete(socket.id);
    call.participants.set(socket.id, { userId, displayName });

    // ← tell the host to initiate WebRTC with this guest's socketId
    io.to(call.hostSocketId).emit("call:guest_ready", {
      guestSocketId: socket.id,
      userId,
      displayName,
    });

    io.to(`call:${roomId}`).emit("call:speaker_joined", {
      userId,
      displayName,
      participantCount: call.participants.size,
    });

    // ← tell the guest they're confirmed as speaker
    socket.emit("call:speaker_accepted", { roomId, mode: call.mode });
  });

  // ─── P2P signaling ────────────────────────────────────────────────────
  socket.on("call:offer", ({ offer, targetSocketId }) => {
    io.to(targetSocketId).emit("call:offer", { offer, fromSocketId: socket.id });
  });

  socket.on("call:answer", ({ answer, targetSocketId }) => {
    io.to(targetSocketId).emit("call:answer", { answer, fromSocketId: socket.id });
  });

  socket.on("call:ice_candidate", ({ candidate, targetSocketId }) => {
    io.to(targetSocketId).emit("call:ice_candidate", { candidate, fromSocketId: socket.id });
  });

  // ─── screen share ─────────────────────────────────────────────────────
  socket.on("call:screen_share_started", ({ roomId }) => {
    socket.to(`call:${roomId}`).emit("call:screen_share_started", { socketId: socket.id });
  });

  socket.on("call:screen_share_stopped", ({ roomId }) => {
    socket.to(`call:${roomId}`).emit("call:screen_share_stopped", { socketId: socket.id });
  });

  // ─── end call ─────────────────────────────────────────────────────────
  socket.on("call:end", ({ roomId }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    const meta = socketMeta.get(socket.id);
    if (!meta || meta.userId !== call.hostId) {
      socket.emit("call:error", { message: "Only the host can end the call." });
      return;
    }

    io.to(`call:${roomId}`).emit("call:ended", { roomId });
    activeCalls.delete(roomId);
    console.log(`Call ended in room ${roomId}`);
  });

  // ─── individual leave ─────────────────────────────────────────────────
  socket.on("call:leave", ({ roomId }) => {
    _handleCallLeave(socket, roomId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    const meta = socketMeta.get(socket.id);
    if (meta?.roomId) _handleCallLeave(socket, meta.roomId);
    socketMeta.delete(socket.id);
  });
});

// ─── helper ───────────────────────────────────────────────────────────────────
function _handleCallLeave(socket, roomId) {
  const call = activeCalls.get(roomId);
  if (!call) return;

  const meta = socketMeta.get(socket.id);
  const wasAudience = call.audience.has(socket.id); // ← check before deleting

  call.participants.delete(socket.id);
  call.audience.delete(socket.id);
  socket.leave(`call:${roomId}`);

  if (meta?.userId === call.hostId) {
    io.to(`call:${roomId}`).emit("call:ended", { roomId });
    activeCalls.delete(roomId);
    return;
  }

  if (wasAudience) {
    // ← tell host to remove them from audience panel
    io.to(call.hostSocketId).emit("call:audience_left", { socketId: socket.id });
    return;
  }

  io.to(`call:${roomId}`).emit("call:speaker_left", {
    userId: meta?.userId,
    participantCount: call.participants.size,
  });
}

// ─── boot ─────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});