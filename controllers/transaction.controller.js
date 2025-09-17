import mongoose from "mongoose";
import Transaction from "../models/transactionModel.js";
import Wallet from "../models/wallet.model.js";
import CustomError from "../utils/errorHandler.js";
import { investmentPlans } from "../configs/config.js";

// Create a new transaction (deposit, investment, etc.)
export const createTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { type, amount, method, investmentPlan } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      throw new CustomError(400, "Invalid transaction amount", "ValidationError");
    }

    // Find wallet
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) throw new CustomError(404, "Wallet not found", "ValidationError");

    let investmentDuration, returnOnInvestment;

    // Investment logic
    if (type === "investment") {
      if (!investmentPlan) {
        throw new CustomError(400, "Investment plan is required", "ValidationError");
      }

      const planConfig = investmentPlans[investmentPlan];
      if (!planConfig) {
        throw new CustomError(400, "Invalid investment plan selected", "ValidationError");
      }

      investmentDuration = planConfig.duration;
      returnOnInvestment = planConfig.roi;

      // this one de check for available balance
      const available = parseFloat(wallet.availableBalance.toString());
      if (available < amount) {
        throw new CustomError(400, "Insufficient available balance for investment", "ValidationError");
      }

      // Then this one de educt from available balance
      wallet.availableBalance = mongoose.Types.Decimal128.fromString(
        (available - amount).toString()
      );
      wallet.lastTransactionAt = new Date();
      await wallet.save({ session });
    }

    // normal deposit na him be this one, funds go to pending) ---
    if (type === "deposit") {
      const pending = parseFloat(wallet.pendingDeposits.toString());
      wallet.pendingDeposits = mongoose.Types.Decimal128.fromString(
        (pending + amount).toString()
      );
      wallet.lastTransactionAt = new Date();
      await wallet.save({ session });
    }

    // Create transaction
    const txn = new Transaction({
      user: userId,
      type,
      amount,
      method,
      investmentPlan,
      investmentDuration,
      returnOnInvestment,
      status: type === "investment" ? "active" : "pending", // investments go active immediately
    });

    await txn.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction created successfully`,
      transaction: txn,
      wallet,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


// Admin: Get all transactions (with optional filters + pagination)
export const getAllTransactions = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 10, startDate, endDate } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// User: Get transactions for logged-in user (with optional filters + pagination)
export const getUserTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, type, page = 1, limit = 10, startDate, endDate } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const query = { user: userId };
    if (status) query.status = status;
    if (type) query.type = type;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction by ID (admin or owner)
export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID" });
    }

    const txn = await Transaction.findById(id)
      .populate("user", "username email")
      .populate("approvedBy", "username email");

    if (!txn) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, transaction: txn });
  } catch (error) {
    next(error);
  }
};

//User: Request a withdrawal
export const requestWithdrawal = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { amount, method, walletAddress } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new CustomError(400, "Invalid withdrawal amount", "ValidationError");
    }

    // Get user & check KYC/profile
    const user = await mongoose.model("User").findById(userId).session(session);
    if (!user) throw new CustomError(404, "User not found", "ValidationError");

    const profileOk = user.isProfileComplete;
    const hasIdDoc = Array.isArray(user.idDocuments) && user.idDocuments.length > 0;
    const hasSelfies = Array.isArray(user.selfieCaptures) && user.selfieCaptures.length >= 2;
    const kycVerified = user.kyc && user.kyc.status === "verified"; // ✅ standardize to "verified"

    if (!profileOk || !hasIdDoc || !hasSelfies || !kycVerified) {
      throw new CustomError(
        403,
        "Withdrawal blocked: complete profile and pass KYC verification first",
        "KYCError"
      );
    }

    // Get wallet
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) throw new CustomError(404, "Wallet not found", "ValidationError");

    const available = parseFloat(wallet.availableBalance.toString());
    if (available < amount) {
      throw new CustomError(400, "Insufficient available balance", "ValidationError");
    }

    // Create withdrawal transaction
    const txn = new Transaction({
      user: userId,
      type: "withdrawal",
      amount,
      method,
      walletAddress,
      status: "pending",
    });

    await txn.save({ session });

    // Update wallet: deduct available → pending
    wallet.availableBalance = mongoose.Types.Decimal128.fromString((available - amount).toString());
    const pendingWithdrawals = parseFloat(wallet.pendingWithdrawals?.toString() || "0");
    wallet.pendingWithdrawals = mongoose.Types.Decimal128.fromString(
      (pendingWithdrawals + amount).toString()
    );
    wallet.lastTransactionAt = new Date();

    await wallet.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      transaction: txn,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


// Admin: Approve or reject a withdrawal request
export const reviewWithdrawal = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { action } = req.body; // "approve" | "reject"
    const adminId = req.user._id;

    const txn = await Transaction.findById(transactionId).populate("user");
    if (!txn) throw new CustomError(404, "Transaction not found", "ValidationError");

    if (txn.type !== "withdrawal") {
      throw new CustomError(400, "Transaction is not a withdrawal", "ValidationError");
    }

    if (txn.status !== "pending") {
      throw new CustomError(400, "Withdrawal already reviewed", "ValidationError");
    }

    const wallet = await Wallet.findOne({ user: txn.user._id });
    if (!wallet) throw new CustomError(404, "Wallet not found", "ValidationError");

    const pendingWithdrawals = parseFloat(wallet.pendingWithdrawals?.toString() || "0");

    if (action === "approve") {
      // if Approved: money leaves system
      txn.status = "accepted";
      txn.approvedBy = adminId;

      // Deduct permanently from pendingWithdrawals
      wallet.pendingWithdrawals = mongoose.Types.Decimal128.fromString(
        (pendingWithdrawals - txn.amount).toString()
      );
    } else if (action === "reject") {
      // if Reject: refund back to available balance
      txn.status = "rejected";
      txn.approvedBy = adminId;

      wallet.pendingWithdrawals = mongoose.Types.Decimal128.fromString(
        (pendingWithdrawals - txn.amount).toString()
      );

      const available = parseFloat(wallet.availableBalance.toString());
      wallet.availableBalance = mongoose.Types.Decimal128.fromString(
        (available + txn.amount).toString()
      );
    } else {
      throw new CustomError(400, "Invalid action. Use 'approve' or 'reject'", "ValidationError");
    }

    wallet.lastTransactionAt = new Date();

    await txn.save();
    await wallet.save();

    res.status(200).json({
      success: true,
      message: `Withdrawal ${action}ed successfully`,
      transaction: txn,
      wallet,
    });
  } catch (error) {
    next(error);
  }
};
