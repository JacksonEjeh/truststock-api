import express from "express";
import authenticate from "../utils/authenticate.js"; 
import authorize from "../utils/authorize.js";
import { handleDepositApproval } from "../controllers/deopsitApproval.controller.js";

const router = express.Router();

// Approve/reject a deposit (admin only)
router.put("/:transactionId/approve", authenticate, authorize("admin"), async (req, res) => {
  const { transactionId } = req.params;
  const { approved } = req.body; // true = approve, false = reject
  const adminId = req.user._id;

  const result = await handleDepositApproval(transactionId, approved, adminId);
  res.status(result.success ? 200 : 400).json(result);
});

export default router;
