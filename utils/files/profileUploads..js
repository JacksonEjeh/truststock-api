import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../../configs/config.js";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "profile_picture",
        recourse_type: "image",
        format: "webp", // this converts all images to webp
        transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto:low"},
            { fetch_format: "webp" },
            { bytes_limit: 1024000 }, // ensures final image is under 1mb
        ],
    },
});

const profileUpload = multer({ storage });
export default profileUpload;
