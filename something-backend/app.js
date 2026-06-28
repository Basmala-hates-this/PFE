
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

const postRoutes = require("./routes/post.routes");
const roomRoutes = require("./routes/room.routes");
const userRoutes = require("./routes/user.routes");
const path = require("path");
const app = express();

app.set("trust proxy", 1);

const rateLimit = require("express-rate-limit");
const messageRoutes = require("./routes/message.routes");

const adminRoutes = require("./routes/admin.routes");

const aiRouter = require ("./routes/ai.js");
app.set("trust proxy", 1);

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 20 requests per 15 minutes,this is a reasonable amount of guest loging per person...right?200 for testing only for nw
  message: { message: "Too many requests, slow down a little..." }
});
const notificationRoutes = require('./routes/notificationRoutes');

app.use("/api/posts", publicLimiter);
app.use("/api/rooms/public-rooms", publicLimiter);

app.use(cors());//thiss so the damn browser dont block the 2 diffrent ports call(aka frontend aand backend)
app.use(express.json());


app.use("/api/rooms", roomRoutes);

app.use("/api/auth", authRoutes);


app.use("/api/posts", postRoutes);

app.use("/api/users", userRoutes);

app.use("/api/admin", adminRoutes);

// app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//private rooms
app.use("/api/rooms", messageRoutes);


app.use("/api/ai", aiRouter);


app.use('/api/notifications', notificationRoutes);

//crash catcher
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
  }
  if (err.message === 'Images and PDF only!') {
    return res.status(400).json({ message: 'Invalid file type. Images and PDFs only.' });
  }
  next(err);
});

// app.get("/health", (req, res) => res.json({ status: "ok" }));
module.exports = app;