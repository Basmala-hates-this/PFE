require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);



const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true, // needed so the cookie actually gets sent on the handshake
  },
});

// ─── auth middleware: runs once per connection, before "connection" fires ───
io.use((socket, next) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    if (!rawCookie) return next(new Error("unauthorized"));
    console.log("Handshake cookie header:", socket.handshake.headers.cookie);

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token; // whatever name httpOnly cookie uses —

    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    socket.data.userId = decoded.id;
    socket.data.displayName = decoded.username; // also — payload has "username", not "displayName"
   // socket.data.displayName = decoded.displayName || decoded.name;
    next();
  } catch (err) {
    next(new Error("unauthorized"));
  }
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
         hostName: call.hostName,
        participantCount: call.participants.size,
      });
    }
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
  });

  // ─── host starts call ─────────────────────────────────────────────────
  // socket.on("call:start", ({ roomId, userId, displayName }) => {
  //socketMeta.set(socket.id, { userId, roomId, displayName });
  
  socket.on("call:start", ({ roomId }) => {
  const userId = socket.data.userId;
  const displayName = socket.data.displayName;
  socketMeta.set(socket.id, { userId, roomId, displayName });

    if (activeCalls.has(roomId)) {
      socket.emit("call:error", { message: "A call is already active in this room." });
      return;
    }

    activeCalls.set(roomId, {
      hostId: userId,
      hostSocketId: socket.id,
      hostName: displayName,
      // participants = everyone who currently PUBLISHES (host + active speakers)
      participants: new Map([[socket.id, { userId, displayName }]]),
      // audience = everyone who currently only RECEIVES
      audience: new Set(),
      active: true,
      mode: "broadcast",
    });

    socket.join(`call:${roomId}`);

    socket.to(roomId).emit("call:incoming", {
      roomId,
      hostId: userId,
      hostName: displayName,
    });

    socket.emit("call:started", { roomId, mode: "broadcast" });
    console.log(`Call started in room ${roomId} by ${userId}`);
  });

  // ─── user joins as audience ───────────────────────────────────────────
  socket.on("call:join_audience", ({ roomId, 
    //userId,
     displayName }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    socketMeta.set(socket.id, { userId, roomId, displayName });
    call.audience.add(socket.id);
    socket.join(`call:${roomId}`);

    // tell the HOST specifically (drives the "invite to speak" audience panel UI)
    io.to(call.hostSocketId).emit("call:audience_joined", {
      userId,
      displayName,
      socketId: socket.id,
    });

    // ← NEW: tell EVERY current publisher (host + any active speakers), not just
    // the host, so each of them opens a connection and publishes to this viewer.
    for (const publisherSocketId of call.participants.keys()) {
      io.to(publisherSocketId).emit("call:viewer_joined", {
        viewerSocketId: socket.id,
        userId,
        displayName,
      });
    }

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

    if (targetSocketId) {
      io.to(targetSocketId).emit("call:speaker_invite", {
        roomId,
        fromHostId: call.hostId,
      });
    }
  });

  // ─── guest accepts speaker invite ─────────────────────────────────────
  socket.on("call:accept_speaker", ({ roomId,
    // userId,
      displayName }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    if (call.participants.size >= 4) {
      socket.emit("call:error", { message: "Max 4 speakers reached." });
      return;
    }

    // snapshot who exists BEFORE we add the new speaker
    // const existingSpeakerSocketIds = [...call.participants.keys()];
    // const existingViewerSocketIds = [...call.audience];
    const existingSpeakerSocketIds = [...call.participants.keys()].filter((id) => id !== socket.id);
const existingViewerSocketIds  = [...call.audience].filter((id) => id !== socket.id);

    call.audience.delete(socket.id);
    call.participants.set(socket.id, { userId, displayName });

    // ← NEW: tell the NEW speaker exactly who they need to connect to.
    // They will initiate a bidirectional connection to each other speaker,
    // and a publishing (send-only, from their side) connection to each viewer.
    socket.emit("call:call_targets", {
      speakers: existingSpeakerSocketIds,
      viewers: existingViewerSocketIds,
    });

    io.to(`call:${roomId}`).emit("call:speaker_joined", {
      userId,
      displayName,
      socketId: socket.id,
      participantCount: call.participants.size,
    });

    socket.emit("call:speaker_accepted", { roomId, mode: call.mode });
  });

  // ─── P2P signaling (unchanged — already generic by socketId) ──────────
  socket.on("call:offer", ({ offer, targetSocketId }) => {
    io.to(targetSocketId).emit("call:offer", { offer, fromSocketId: socket.id });
  });

  socket.on("call:answer", ({ answer, targetSocketId }) => {
    io.to(targetSocketId).emit("call:answer", { answer, fromSocketId: socket.id });
  });

  socket.on("call:ice_candidate", ({ candidate, targetSocketId }) => {
    io.to(targetSocketId).emit("call:ice_candidate", { candidate, fromSocketId: socket.id });
  });

  // ─── screen share (unchanged — already includes socketId) ─────────────
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

  //───ehh...avatar for when cam is off─────────────────────────────────────────────────
socket.on("call:cam_status", ({ roomId, isCamOff }) => {
  socket.to(`call:${roomId}`).emit("call:cam_status", { socketId: socket.id, isCamOff });
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
  const wasAudience = call.audience.has(socket.id);
  const wasSpeaker = call.participants.has(socket.id);

  call.participants.delete(socket.id);
  call.audience.delete(socket.id);
  socket.leave(`call:${roomId}`);

  if (meta?.userId === call.hostId) {
    io.to(`call:${roomId}`).emit("call:ended", { roomId });
    activeCalls.delete(roomId);
    return;
  }

  if (wasAudience) {
    io.to(call.hostSocketId).emit("call:audience_left", { socketId: socket.id });
    // ← NEW: any speaker who had a connection to this viewer needs to tear it down
    for (const publisherSocketId of call.participants.keys()) {
      io.to(publisherSocketId).emit("call:peer_left", { socketId: socket.id });
    }
    return;
  }

  if (wasSpeaker) {
    // ← NEW: tell every remaining participant + audience member to close
    // whatever peer connection they had open to this speaker.
    io.to(`call:${roomId}`).emit("call:peer_left", { socketId: socket.id });

    io.to(`call:${roomId}`).emit("call:speaker_left", {
      userId: meta?.userId,
      socketId: socket.id,
      participantCount: call.participants.size,
    });
  }
}

// ─── boot ─────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});