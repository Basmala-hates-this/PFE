// //my problem is with editing the pfp....i wnt users to be comfy with whatever photo they want...some can be big,...multer to the resque
// // if i ever forgot what multer do
// // User selects image → 
// // frontend sends as multipart/form-data → 
// // multer saves file to /uploads folder → 
// // backend stores file path like "/uploads/filename.jpg" → 
// // frontend displays image using that path






// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + path.extname(file.originalname);
//     cb(null, uniqueName);
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
//   fileFilter: (req, file, cb) => {
//     const allowedExts = /jpeg|jpg|png|gif|webp|pdf|mp4|mov|avi|mkv|webm/;
//   const allowedMimes = /image\/(jpeg|jpg|png|gif|webp)|application\/pdf|video\/(mp4|quicktime|x-msvideo|x-matroska|webm)/;

//   const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
//   const mimeValid = allowedMimes.test(file.mimetype);

//   if (extValid && mimeValid) cb(null, true);
//   else cb(new Error("Images, PDFs, and videos only!"));
//   }
// });


// module.exports = upload;

// const multer = require("multer");
// const path = require("path");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../config/cloudinary");

// const cloudinaryStorage = new CloudinaryStorage({
//   cloudinary,
//   params: (req, file) => {
//     const isVideo = /video\//.test(file.mimetype);
//     const isPDF = file.mimetype === "application/pdf";
//     return {
//       folder: "glaukopis",
//       resource_type: isVideo ? "video" : isPDF ? "raw" : "image",
//       allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "mp4", "mov", "avi", "mkv", "webm"],
//     };
//   },
// });

// const upload = multer({
//   storage: cloudinaryStorage,
//   limits: { fileSize: 20 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowedExts = /jpeg|jpg|png|gif|webp|pdf|mp4|mov|avi|mkv|webm/;
//     const allowedMimes = /image\/(jpeg|jpg|png|gif|webp)|application\/pdf|video\/(mp4|quicktime|x-msvideo|x-matroska|webm)/;
//     const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
//     const mimeValid = allowedMimes.test(file.mimetype);
//     if (extValid && mimeValid) cb(null, true);
//     else cb(new Error("Images, PDFs, and videos only!"));
//   }
// });

// module.exports = upload;

const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = /video\//.test(file.mimetype);
    const isAudio = /audio\//.test(file.mimetype);
    const isPDF = file.mimetype === "application/pdf";
    return {
      folder: "glaukopis",
      resource_type: isVideo || isAudio ? "video" : isPDF ? "raw" : "image",
      // Cloudinary handles audio under the "video" resource_type
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "mp4", "mov", "avi", "mkv", "webm", "mp3", "ogg", "wav", "m4a"],
    };
  },
});

const upload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExts = /jpeg|jpg|png|gif|webp|pdf|mp4|mov|avi|mkv|webm|mp3|ogg|wav|m4a/;
    const allowedMimes = /image\/(jpeg|jpg|png|gif|webp)|application\/pdf|video\/(mp4|quicktime|x-msvideo|x-matroska|webm)|audio\/(webm|ogg|mp4|mpeg|wav|x-wav|m4a)/;
    const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const mimeValid = allowedMimes.test(file.mimetype);
    if (extValid && mimeValid) cb(null, true);
    else cb(new Error("Images, PDFs, videos, and audio only!"));
  }
});


module.exports = upload;