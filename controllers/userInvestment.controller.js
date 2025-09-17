import mongoose from "mongoose";
import InvestmentPlan from "../models/investmentPlanModel.js";
import UserInvestment from "../models/userInvestment.model.js";
import Wallet from "../models/wallet.model.js";
import CustomError from "../utils/errorHandler.js";

export const createUserInvestment = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { planId, amount } = req.body;
        const userId = req.user._id;

        if (!planId || !amount) {
            throw new CustomError(400, "Plan ID and amount are required");
        }

        const plan = await InvestmentPlan.findById(planId);
        if (!plan) throw new CustomError(404, "Investment plan not found");

        // Validate amount range
        if (amount < plan.amount_range.min || amount > plan.amount_range.max) {
            throw new CustomError(
                400,
                `Amount must be between ${plan.amount_range.min} and ${plan.amount_range.max}`
            );
        }

        // Find wallet
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) throw new CustomError(404, "Wallet not found");

        const availableBalance = parseFloat(wallet.availableBalance.toString());
        if (availableBalance < amount) {
            throw new CustomError(400, "Insufficient balance");
        }

        // Deduct from available balance → move to invested balance
        wallet.availableBalance = availableBalance - amount;
        wallet.investedBalance = parseFloat(wallet.investedBalance.toString()) + amount;
        wallet.lastTransactionAt = new Date();
        await wallet.save({ session });

        // Calculate maturity date
        let durationInDays = plan.duration.value;
        if (plan.duration.unit === "months") durationInDays *= 30;
        if (plan.duration.unit === "years") durationInDays *= 365;

        const maturityDate = new Date();
        maturityDate.setDate(maturityDate.getDate() + durationInDays);

        // Create user investment record
        const investment = new UserInvestment({
            user: userId,
            plan: plan._id,
            amount,
            startDate: new Date(),
            maturityDate,
        });

        await investment.save({ session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: investment });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

export const getUserInvestments = async (req, res, next) => {
    try {
        const userId = req.user?._id
        const { status } = req.query;

        if (!userId) {
            throw new CustomError(400, "User ID is required");
        }

        let filter = { user: userId };
        if (status) {
            if (!["active", "completed", "cancelled"].includes(status)) {
                throw new CustomError(400, "Invalid status filter");
            }
            filter.status = status;
        }

        const investments = await UserInvestment.find(filter)
        .populate("plan", "investment_plan interest duration amount_range")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: investments.length,
            data: investments,
        });
    } catch (error) {
        next(error);
    }
};