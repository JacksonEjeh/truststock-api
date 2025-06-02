import express from "express";
import { getUserTransactions, getWallet, initiateDeposit, initiateWithdrawal } from "../controllers/wallet.controller.js";
import authenticate from "../utils/authenticate.js";

const router = express.Router();

router.get('/', authenticate, getWallet);
router.post('/deposit', authenticate, initiateDeposit);
router.post('/withdraw', authenticate, initiateWithdrawal);
router.get('/transactions', authenticate, getUserTransactions);

export default router;