import express from "express";
import { signUp, verifyOTP, resendOTP, signIn, refreshToken, logout, resetPassword, forgotPassword, changePassword } from "../controllers/auth.controller.js";
import authenticate from "../utils/authenticate.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/signin", signIn);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword)  

export default router;