import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
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
      enum: ["btc", "ltc", "usdt", "bank", "crypto"],
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
      type: mongoose.Schema.Types.Decimal128, // 👈 store with high precision
      required: true,
    },
    lastRoiCreditedAt: Date,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
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
    receiptUrl: {
      type: String,
      required: function () {
        return this.type === "deposit";
      },
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.set("toJSON", {
  transform: (doc, ret) => {
    const convertDecimal = (val) => parseFloat(val?.toString() || "0");
    ret.amount = convertDecimal(ret.amount);
    return ret;
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
