import mongoose from "mongoose";

const investmentPlanSchema = new mongoose.Schema(
  {
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    investment_plan: {
        type: String,
        enum: ["promo", "basic", "standard", "premium", "gold", "platinum"],
        required: true,
    },
    investment_type: {
        type: String,
        enum: ["personal", "business", "corporate"],
        default: "personal",
        required: true,
    },
    duration: {
        value: {
            type: Number,
            required: true,
        },
        unit: {
            type: String,
            enum: ["days", "months", "years"],
            default: "days",
        },
    },
    interest: {
        type: Number,
        required: true,
    },
    amount_range: {
        min: {
            type: Number,
            required: true,
        },
        max: {
            type: Number,
            required: true,
        },
    },
  },
  { timestamps: true }
);

const InvestmentPlan = mongoose.model("InvestmentPlan", investmentPlanSchema);
export default InvestmentPlan;