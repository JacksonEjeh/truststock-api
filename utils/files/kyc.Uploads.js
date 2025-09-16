import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../../configs/config.js";

const allowedFormats = ["jpeg", "jpg", "png", "pdf", "webp"];

const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "kyc";
    if (file.fieldname === "selfies") folder = "kyc/selfies";
    if (file.fieldname === "idFiles") folder = "kyc/id-docs";

    return {
      folder,
      format: file.mimetype.split("/")[1] || "jpg",
      resource_type: "auto", 
      transformation:
        file.fieldname === "selfies"
          ? [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto:good" },
              { fetch_format: "webp" },
            ]
          : [], 
    };
  },
});

const kycUpload = multer({
  storage: kycStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    if (allowedFormats.includes(ext)) cb(null, true);
    else cb(new Error("Invalid file type"), false);
  },
});

export default kycUpload;
