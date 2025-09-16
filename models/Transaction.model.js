import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "earning", "transfer", "investment"],
    required: true,
  },
  method: {
    type: String,
    enum: ["btc", "ltc", "usdt"],
    required: true,
  },
  investmentPlan: {
    type: String,
    enum: ["basic", "standard", "premium", "gold", "platinum"],
  },
  investmentDate: {
    type: Date,
    default: Date.now,
  },
  investmentDuration: {
    type: Number, // in days
  },
  returnOnInvestment: {
    type: Number, // percentage
  },
  amount: {
    type: Number,
    required: true,
  },
  lastRoiCreditedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  walletAddress: String,
  reference: {
    type: String,
    unique: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
