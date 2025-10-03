// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
         cloudinary.uploader
        .upload_stream({ resource_type: "image", folder }, (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
        })
        .end(fileBuffer);
  });
};
