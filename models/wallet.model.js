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
    availableBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
    investedBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0, // locked in investment plans
    },
    pendingDeposits: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
    pendingWithdrawals: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
    accruedInterest: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0, // daily ROI accumulated but not yet matured
    },
    totalEarnings: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0, // all-time profit
    },
    lastTransactionAt: {
        type: Date,
    },
}, { timestamps: true });

// Ensure decimals are converted to float in API responses
walletSchema.set("toJSON", {
    transform: (doc, ret) => {
        const convertDecimal = (val) => parseFloat(val?.toString() || "0");
        ret.availableBalance = convertDecimal(ret.availableBalance);
        ret.investedBalance = convertDecimal(ret.investedBalance);
        ret.pendingDeposits = convertDecimal(ret.pendingDeposits);
        ret.pendingWithdrawals = convertDecimal(ret.pendingWithdrawals);
        ret.accruedInterest = convertDecimal(ret.accruedInterest);
        ret.totalEarnings = convertDecimal(ret.totalEarnings);
        return ret;
    },
});

// Helper to compute total wallet value
walletSchema.methods.getTotalValue = function () {
    return (
        parseFloat(this.availableBalance.toString()) +
        parseFloat(this.investedBalance.toString()) +
        parseFloat(this.pendingDeposits.toString()) +
        parseFloat(this.accruedInterest.toString())
    );
};

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;