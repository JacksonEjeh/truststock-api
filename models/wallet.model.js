import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    currency: {
        type: String,
        enum: ["USD", "EUR", "BTC", "ETH"],
        default: "USD",
    },
    availableBalance: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    investedBalance: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    pendingDeposits: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    pendingWithdrawals: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    accruedInterest: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    totalEarnings: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    lastTransactionAt: { type: Date },

    avgROI: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
}, { timestamps: true });

walletSchema.set("toJSON", {
  transform: (doc, ret) => {
    const convertDecimal = (val) => parseFloat(val?.toString() || "0");
    ret.availableBalance = convertDecimal(ret.availableBalance);
    ret.investedBalance = convertDecimal(ret.investedBalance);
    ret.pendingDeposits = convertDecimal(ret.pendingDeposits);
    ret.pendingWithdrawals = convertDecimal(ret.pendingWithdrawals);
    ret.accruedInterest = convertDecimal(ret.accruedInterest);
    ret.totalEarnings = convertDecimal(ret.totalEarnings);
    ret.avgROI = convertDecimal(ret.avgROI);
    return ret;
  },
});

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
