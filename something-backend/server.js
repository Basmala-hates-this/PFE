       

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
const mediasoupManager = require("./services/mediasoup.manager");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

// roomId -> call state
// { hostId, participants: Set<socketId>, audience: Set<socketId>, active: bool }
const activeCalls = new Map();

// socketId -> { userId, roomId, displayName }
const socketMeta = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ─── existing chat events ────────────────────────────────────────────
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // if a call is active in this room, notify the joiner
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

  // ─── call: host starts a call ────────────────────────────────────────
  socket.on("call:start", ({ roomId, userId, displayName }) => {
    socketMeta.set(socket.id, { userId, roomId, displayName });

    if (activeCalls.has(roomId)) {
      socket.emit("call:error", { message: "A call is already active in this room." });
      return;
    }

    activeCalls.set(roomId, {
      hostId: userId,
      hostSocketId: socket.id,
      participants: new Map([[socket.id, { userId, displayName }]]), // socketId -> meta
      audience: new Set(),
      active: true,
      mode: "p2p", // starts as p2p, upgrades to sfu when 3rd joins
    });

    socket.join(`call:${roomId}`);

    // notify everyone else in the room
    socket.to(roomId).emit("call:incoming", {
      roomId,
      hostId: userId,
      hostName: displayName,
    });

    socket.emit("call:started", { roomId, mode: "p2p" });
    console.log(`Call started in room ${roomId} by ${userId}`);
  });

  // ─── call: user joins as audience ────────────────────────────────────
  socket.on("call:join_audience", ({ roomId, userId, displayName }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    socketMeta.set(socket.id, { userId, roomId, displayName });
    call.audience.add(socket.id);
    socket.join(`call:${roomId}`);

    // tell everyone in the call a new audience member joined
    io.to(`call:${roomId}`).emit("call:audience_joined", { userId, displayName });

    // send the joiner the current participant list
    const participantList = [...call.participants.values()];
    socket.emit("call:state", {
      roomId,
      mode: call.mode,
      hostId: call.hostId,
      participants: participantList,
    });
  });

  // ─── call: host invites someone to speak ─────────────────────────────
  socket.on("call:invite_speaker", ({ roomId, targetUserId }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    const meta = socketMeta.get(socket.id);
    if (!meta || meta.userId !== call.hostId) {
      socket.emit("call:error", { message: "Only the host can invite speakers." });
      return;
    }

    // find the target's socket id from audience
    let targetSocketId = null;
    for (const [sid, m] of socketMeta.entries()) {
      if (m.userId === targetUserId && m.roomId === roomId) {
        targetSocketId = sid;
        break;
      }
    }

    if (targetSocketId) {
      io.to(targetSocketId).emit("call:speaker_invite", { roomId, fromHostId: call.hostId });
    }
  });

  // ─── call: invited user accepts speaking role ─────────────────────────
  socket.on("call:accept_speaker", async ({ roomId, userId, displayName }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    if (call.participants.size >= 4) {
      socket.emit("call:error", { message: "Max 4 speakers reached." });
      return;
    }

    call.audience.delete(socket.id);
    call.participants.set(socket.id, { userId, displayName });

    // upgrade to SFU mode when 3rd participant joins
    if (call.participants.size >= 3 && call.mode === "p2p") {
      call.mode = "sfu";
      io.to(`call:${roomId}`).emit("call:upgrade_to_sfu", { roomId });
    }

    io.to(`call:${roomId}`).emit("call:speaker_joined", {
      userId,
      displayName,
      mode: call.mode,
      participantCount: call.participants.size,
    });

    socket.emit("call:speaker_accepted", { roomId, mode: call.mode });
  });

  // ─── P2P signaling (used when mode === 'p2p') ────────────────────────
  socket.on("call:offer", ({ roomId, offer, targetSocketId }) => {
    io.to(targetSocketId).emit("call:offer", { offer, fromSocketId: socket.id });
  });

  socket.on("call:answer", ({ roomId, answer, targetSocketId }) => {
    io.to(targetSocketId).emit("call:answer", { answer, fromSocketId: socket.id });
  });

  socket.on("call:ice_candidate", ({ roomId, candidate, targetSocketId }) => {
    io.to(targetSocketId).emit("call:ice_candidate", { candidate, fromSocketId: socket.id });
  });

  // ─── SFU signaling (mediasoup) ────────────────────────────────────────
  socket.on("call:sfu_get_rtp_capabilities", async ({ roomId }) => {
    const router = await mediasoupManager.getOrCreateRouter(roomId);
    socket.emit("call:sfu_rtp_capabilities", { rtpCapabilities: router.rtpCapabilities });
  });

  socket.on("call:sfu_create_transport", async ({ roomId, direction }) => {
    try {
      const transport = await mediasoupManager.createWebRtcTransport(roomId);
      socket.emit("call:sfu_transport_created", {
        direction,
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (err) {
      socket.emit("call:error", { message: "Transport creation failed." });
    }
  });

  socket.on("call:sfu_connect_transport", async ({ transportId, dtlsParameters }) => {
    const transport = mediasoupManager.transports.get(transportId);
    if (transport) await transport.connect({ dtlsParameters });
  });

  socket.on("call:sfu_produce", async ({ transportId, kind, rtpParameters, roomId }) => {
    const transport = mediasoupManager.transports.get(transportId);
    if (!transport) return;

    const producer = await transport.produce({ kind, rtpParameters });
    mediasoupManager.producers.set(producer.id, producer);

    socket.emit("call:sfu_produced", { producerId: producer.id });

    // tell others in the call a new producer is available
    socket.to(`call:${roomId}`).emit("call:sfu_new_producer", {
      producerId: producer.id,
      socketId: socket.id,
    });
  });

  socket.on("call:sfu_consume", async ({ transportId, producerId, rtpCapabilities, roomId }) => {
    const router = await mediasoupManager.getOrCreateRouter(roomId);
    const transport = mediasoupManager.transports.get(transportId);
    if (!transport || !router.canConsume({ producerId, rtpCapabilities })) return;

    const consumer = await transport.consume({ producerId, rtpCapabilities, paused: false });
    mediasoupManager.consumers.set(consumer.id, consumer);

    socket.emit("call:sfu_consumed", {
      consumerId: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    });
  });

  // ─── screen share ─────────────────────────────────────────────────────
  socket.on("call:screen_share_started", ({ roomId }) => {
    socket.to(`call:${roomId}`).emit("call:screen_share_started", { socketId: socket.id });
  });

  socket.on("call:screen_share_stopped", ({ roomId }) => {
    socket.to(`call:${roomId}`).emit("call:screen_share_stopped", { socketId: socket.id });
  });

  // ─── call: end ────────────────────────────────────────────────────────
  socket.on("call:end", ({ roomId }) => {
    const call = activeCalls.get(roomId);
    if (!call) return;

    const meta = socketMeta.get(socket.id);
    if (!meta || meta.userId !== call.hostId) {
      socket.emit("call:error", { message: "Only the host can end the call." });
      return;
    }

    io.to(`call:${roomId}`).emit("call:ended", { roomId });
    mediasoupManager.closeRoom(roomId);
    activeCalls.delete(roomId);
    console.log(`Call ended in room ${roomId}`);
  });

  // ─── call: individual leave ───────────────────────────────────────────
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

// ─── helper ──────────────────────────────────────────────────────────────────
function _handleCallLeave(socket, roomId) {
  const call = activeCalls.get(roomId);
  if (!call) return;

  const meta = socketMeta.get(socket.id);
  call.participants.delete(socket.id);
  call.audience.delete(socket.id);
  socket.leave(`call:${roomId}`);

  // if host left, end the call entirely
  if (meta?.userId === call.hostId) {
    io.to(`call:${roomId}`).emit("call:ended", { roomId });
    mediasoupManager.closeRoom(roomId);
    activeCalls.delete(roomId);
    return;
  }

  // otherwise just notify others
  io.to(`call:${roomId}`).emit("call:speaker_left", {
    userId: meta?.userId,
    participantCount: call.participants.size,
  });

  // downgrade back to p2p if only 2 left
  if (call.participants.size <= 2 && call.mode === "sfu") {
    call.mode = "p2p";
    io.to(`call:${roomId}`).emit("call:downgrade_to_p2p", { roomId });
  }
}

// ─── boot ─────────────────────────────────────────────────────────────────────
mediasoupManager.createWorker().then(() => {
  console.log("mediasoup worker ready");
  app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});