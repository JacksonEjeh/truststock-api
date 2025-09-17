import express from "express";
import authenticate from "../utils/authenticate.js";
import { createUserInvestment, getUserInvestments } from "../controllers/userInvestment.controller.js";

const router = express.Router();

router.post("/", authenticate, createUserInvestment);
router.get("/user/:userId", authenticate, getUserInvestments);

export default router;
