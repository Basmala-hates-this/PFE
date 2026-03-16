const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

const postRoutes = require("./routes/post.routes");
const roomRoutes = require("./routes/room.routes");
const userRoutes = require("./routes/user.routes");
const path = require("path");
const app = express();

app.use(cors());//thiss so the damn browser dont block the 2 diffrent ports call(aka frontend aand backend)
app.use(express.json());


app.use("/api/rooms", roomRoutes);

app.use("/api/auth", authRoutes);


app.use("/api/posts", postRoutes);

app.use("/api/users", userRoutes);

// app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

module.exports = app;