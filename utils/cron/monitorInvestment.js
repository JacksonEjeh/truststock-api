import cron from "node-cron";
import UserInvestment from "../../models/userInvestment.model.js";
import InvestmentPlan from "../../models/investmentPlanModel.js";
import Wallet from "../../models/wallet.model.js";

export const calculateDailyROI = (amount, roiPercentage, durationDays) => {
  // Simple daily ROI = (total interest / durationDays)
  const totalROI = (amount * (roiPercentage / 100));
  return totalROI / durationDays;
};


// Run every day at midnight
const monitorInvestment = () => {
    cron.schedule("0 0 * * *", async () => {
        console.log("Running daily ROI job...");

        try {
            // Get all active investments
            const activeInvestments = await UserInvestment.find({ status: "active" }).populate("plan");

            for (const investment of activeInvestments) {
            const { _id, user, plan, amount, startDate, maturityDate, accruedInterest } = investment;

            // Convert Decimal128
            const investedAmount = parseFloat(amount.toString());
            const accrued = parseFloat(accruedInterest.toString());
            const planDuration = plan.duration.unit === "days" 
                ? plan.duration.value 
                : plan.duration.unit === "months" 
                ? plan.duration.value * 30 
                : plan.duration.value * 365;

            // Calculate daily ROI
            const dailyROI = calculateDailyROI(investedAmount, plan.interest, planDuration);

            // Update investment
            investment.accruedInterest = accrued + dailyROI;

            // Check maturity
            const today = new Date();
            if (today >= maturityDate) {
                investment.status = "completed";

                // Update wallet: move funds back
                const wallet = await Wallet.findOne({ user });
                if (wallet) {
                    wallet.availableBalance = wallet.availableBalance + investedAmount + (accrued + dailyROI);
                    wallet.investedBalance = wallet.investedBalance - investedAmount;
                    wallet.accruedInterest = 0;
                    wallet.totalEarnings = wallet.totalEarnings + (accrued + dailyROI);
                    wallet.lastTransactionAt = today;
                    await wallet.save();
                }
            } else {
                // Just update wallet accruedInterest
                const wallet = await Wallet.findOne({ user });
                if (wallet) {
                    wallet.accruedInterest = wallet.accruedInterest + dailyROI;
                    wallet.totalEarnings = wallet.totalEarnings + dailyROI;
                    await wallet.save();
                }
            }

            await investment.save();
            }

            console.log("Daily ROI job completed ✅");
        } catch (error) {
            console.error("Error in daily ROI job:", error);
        }
    });
}

export default monitorInvestment;