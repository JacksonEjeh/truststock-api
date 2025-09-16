import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import Wallet from "../models/wallet.model.js"
import CustomError from "../utils/errorHandler.js";

const { Decimal128 } = mongoose.Types;

const generateRef = () => {
    return 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

export const getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) throw new CustomError(404, "Wallet not found", "WalletError");

    res.status(200).json({ success: true, wallet });
  } catch (error) {
    next(error);
  }
};


export const initiateDeposit = async (req, res, next) => {
  const { amount, method } = req.body;

  let numericAmount = parseFloat(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !method) {
    return next(
      new CustomError(400, "All fields are required and amount must be a valid number", "DepositError")
    );
  }

  if (numericAmount < 100) {
    return next(new CustomError(400, "Minimum deposit amount is $100", "DepositError"));
  }

  numericAmount = Math.round(numericAmount * 100) / 100;

  const session = await Wallet.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ user: req.user._id }).session(session);
    if (!wallet) throw new CustomError(404, "Wallet not found", "WalletError");

    const txn = await Transaction.create([{
      user: req.user._id,
      type: 'deposit',
      method,
      amount: Decimal128.fromString(numericAmount.toString()),
      status: 'pending',
      reference: generateRef(),
    }], { session });

    const updatedPendingDeposits = parseFloat(wallet.pendingDeposits.toString()) + numericAmount;
    wallet.pendingDeposits = Decimal128.fromString(updatedPendingDeposits.toFixed(2));
    wallet.lastTransactionAt = new Date();
    await wallet.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Deposit initiated. Awaiting approval.',
      transaction: txn[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// INITIATE WITHDRAWAL
export const initiateWithdrawal = async (req, res, next) => {
  const { amount, method, walletAddress } = req.body;

  let numericAmount = parseFloat(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !method || !walletAddress) {
    return next(new CustomError(400, "All fields are required and amount must be valid", "WithdrawalError"));
  }

  if (numericAmount < 100) {
    return next(new CustomError(400, "Minimum deposit amount is $100", "DepositError"));
  }

  // Round to 2 decimal places
  numericAmount = Math.round(numericAmount * 100) / 100;

  const session = await Wallet.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ user: req.user._id }).session(session);
    if (!wallet) throw new CustomError(404, "Wallet not found", "WalletError");

    if (wallet.availableBalance < amount) {
      throw new CustomError(400, "Insufficient balance", "WalletError");
    }

    const updatedPendingWithdrawal = parseFloat(wallet.pendingWithdrawals.toString()) + numericAmount;
    wallet.availableBalance -= numericAmount;
    wallet.pendingWithdrawals = Decimal128.fromString(updatedPendingWithdrawal.toFixed(2));
    wallet.lastTransactionAt = new Date();
    await wallet.save({ session });

    const txn = await Transaction.create([{
      user: req.user._id,
      type: 'withdrawal',
      method,
      amount,
      status: 'pending',
      walletAddress,
      reference: generateRef(),
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, message: 'Withdrawal initiated.', transaction: txn[0] });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// get transaction history for current user
export const getUserTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id}).sort({ createdAt: -1 })
        if (!transactions || transactions.length === 0) {
            throw new CustomError(404, "No transactions found for this user", "TransactionError");
        }
        res.status(200).json({ success: true, transactions})
    } catch (error) {
        next(error)
    }
};