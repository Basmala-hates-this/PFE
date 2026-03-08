const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
// const userRoutes = require("./routes/user.routes");

const app = express();

app.use(cors());//thiss so the damn browser dont block the 2 diffrent ports call(aka frontend aand backend)
app.use(express.json());

app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);

module.exports = app;