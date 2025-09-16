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
// config/investmentPlans.js
const investmentPlans = {
  basic: { duration: 30, roi: 5 },      // 5% over 30 days
  standard: { duration: 60, roi: 8 },
  premium: { duration: 90, roi: 12 },
  gold: { duration: 180, roi: 20 },
  platinum: { duration: 365, roi: 35 },
};
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { config, cloudinary, investmentPlans };
