import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const config = {
  mongo_url: process.env.MONGO_URL,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_ACCESS_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET,
  email: process.env.EMAIL,
  email_password: process.env.EMAIL_PASSWORD,
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { config, cloudinary };
