import InvestmentPlan from "../models/investmentPlanModel.js";
import CustomError from "../utils/errorHandler.js";

export const createInvestmentPlan = async (req, res, next) => {
  try {
    const adminId = req.user?._id; 
    const { investment_plan, investment_type, duration, interest, amount_range } = req.body;

    if (!investment_plan || !duration || !interest || !amount_range) {
      throw new CustomError(400, "All required fields must be provided", "ValidationError");
    }

    const plan = new InvestmentPlan({
      admin: adminId,
      investment_plan,
      investment_type,
      duration,
      interest,
      amount_range,
    });

    await plan.save();
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const getInvestmentPlans = async (req, res, next) => {
  try {
    const plans = await InvestmentPlan.find();
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const getInvestmentPlanById = async (req, res, next) => {
  try {
    const plan = await InvestmentPlan.findById(req.params.id);
    if (!plan) {
      throw new CustomError(404, "Investment plan not found", "NotFoundError");
    }
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const updateInvestmentPlan = async (req, res, next) => {
  try {
    const plan = await InvestmentPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      throw new CustomError(404, "Investment plan not found", "NotFoundError");
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const deleteInvestmentPlan = async (req, res, next) => {
  try {
    const plan = await InvestmentPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      throw new CustomError(404, "Investment plan not found", "NotFoundError");
    }

    res.status(200).json({ success: true, message: "Investment plan deleted successfully" });
  } catch (error) {
    next(error);
  }
};
