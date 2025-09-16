import express from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getUserTransactions,
  requestWithdrawal,
  reviewWithdrawal,
} from "../controllers/transaction.controller.js";
import authenticate from "../utils/authenticate.js";
import authorize from "../utils/authorize.js"; 
import checkKycForWithdrawal from "../utils/kyc/kyc.check.js";

const router = express.Router();

// Users
router.post("/", authenticate, createTransaction);
router.get("/me", authenticate, getUserTransactions);
router.post("/withdraw", authenticate, checkKycForWithdrawal, requestWithdrawal);


// Admin
router.get("/", authenticate, authorize("admin"), getAllTransactions);
router.get("/:id", authenticate, authorize("admin"), getTransactionById);
router.put("/withdraw/:transactionId/review", authenticate, authorize("admin"), reviewWithdrawal);


export default router;
