import mongoose from "mongoose";

const userInvestmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InvestmentPlan",
        required: true,
    },
    amount: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    maturityDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "completed", "cancelled"],
        default: "active",
    },
    accruedInterest: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0, // accumulates daily
    },
}, { timestamps: true });

const UserInvestment = mongoose.model("UserInvestment", userInvestmentSchema);
export default UserInvestment;
