//my problem is with editing the pfp....i wnt users to be comfy with whatever photo they want...some can be big,...multer to the resque
// if i ever forgot what multer do
// User selects image → 
// frontend sends as multipart/form-data → 
// multer saves file to /uploads folder → 
// backend stores file path like "/uploads/filename.jpg" → 
// frontend displays image using that path






const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const  allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
    if (isValid) cb(null, true);
    else cb(new Error("Images and PDF only!"));
  }
});

module.exports = upload;