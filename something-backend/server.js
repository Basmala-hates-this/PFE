const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/register", (req, res) => {
  console.log("Received from frontend:");
  console.log(req.body);

  res.json({ message: "Profile received successfully" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});