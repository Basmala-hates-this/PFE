// mediasoupManager.js
const mediasoup = require("mediasoup");

let worker;
const routers = new Map();     // roomId -> router
const transports = new Map();  // transportId -> transport
const producers = new Map();   // producerId -> producer
const consumers = new Map();   // consumerId -> consumer

const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: {},
  },
];

const createWorker = async () => {
  worker = await mediasoup.createWorker({
    logLevel: "warn",
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  });
  worker.on("died", () => {
    console.error("mediasoup worker died, exiting...");
    process.exit(1);
  });
  return worker;
};

const getOrCreateRouter = async (roomId) => {
  if (routers.has(roomId)) return routers.get(roomId);
  const router = await worker.createRouter({ mediaCodecs });
  routers.set(roomId, router);
  return router;
};

const createWebRtcTransport = async (roomId) => {
  const router = await getOrCreateRouter(roomId);
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: process.env.ANNOUNCED_IP || "127.0.0.1" }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });
  transports.set(transport.id, transport);
  return transport;
};

const closeRoom = (roomId) => {
  if (routers.has(roomId)) {
    routers.get(roomId).close();
    routers.delete(roomId);
  }
};

module.exports = {
  createWorker,
  getOrCreateRouter,
  createWebRtcTransport,
  transports,
  producers,
  consumers,
  closeRoom,
};