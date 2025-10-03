// utils/upload.js
import multer from "multer";
const storage = multer.memoryStorage(); // keeps file in memory before sending to Cloudinary
export const upload = multer({ storage });
