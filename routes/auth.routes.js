import express from "express";
import { signUp, verifyOTP, resendOTP, signIn, refreshToken, logout, resetPassword, forgotPassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/signin", signIn);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);  

export default router;