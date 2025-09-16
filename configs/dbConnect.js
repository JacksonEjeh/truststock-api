import mongoose from "mongoose";
import {config} from "./config.js";
const connectDataBase = async () => {
  try {
  //  console.log("Connecting to:", config);
    await mongoose.connect(config.mongo_url);
    console.log("MongoDB connected");
  } catch (error) {
    if (error.code === "ENOTFOUND" || error.message.includes("ECONNRESET")) {
      console.error(
        "Unable to connect to MongoDB. Check your internet connection and try again."
      );
      process.exit(1);
    } else {
      console.error("MongoDB connection error:", error.message);
      process.exit(1);
    }
  }
};

export default connectDataBase;