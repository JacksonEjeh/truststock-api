import express from "express";
import authenticate from "../utils/authenticate.js";
import { getUserById, updateUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get('/me', authenticate, getUserById);
router.put('/update/me', authenticate, updateUser);

export default router;