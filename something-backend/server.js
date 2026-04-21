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

require("dotenv").config();
const app = require("./app");
 
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});          