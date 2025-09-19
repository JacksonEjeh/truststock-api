import express from "express";
import authenticate from "../utils/authenticate.js";
import { createUserInvestment, getUserInvestments } from "../controllers/userInvestment.controller.js";
import { processInvestments } from "../utils/cron/monitorInvestment.js";

const router = express.Router();

router.post("/", authenticate, createUserInvestment);
router.get("/user/:userId", authenticate, getUserInvestments);

// Manual trigger for testing
router.post("/test-cron", async (req, res) => {
  try {
    await processInvestments();
    res.status(200).json({ success: true, message: "Cron job executed manually ✅" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
