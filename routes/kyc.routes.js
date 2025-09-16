import express from "express";
import authenticate from "../utils/authenticate.js";
import kycUpload from "../utils/files/kyc.Uploads.js";
import { reviewKyc, uploadIdDocs, uploadSelfies } from "../controllers/kyc.controller.js";
import authorize from "../utils/authorize.js";

const router = express.Router();

router.patch(
  "/kyc/:userId",
  authenticate,
  authorize("admin"), 
  reviewKyc
);

// Upload ID docs (passport, driver’s license, etc.)
router.post(
  "/upload-id",
  authenticate,
  kycUpload.array("idFiles", 3), 
  uploadIdDocs
);

// Upload live selfies (left, right, smiling, neutral, etc.)
router.post(
  "/upload-selfies",
  authenticate,
  kycUpload.array("selfies", 10), 
  uploadSelfies
);

export default router;
