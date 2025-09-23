import cron from "node-cron";
import mongoose from "mongoose";
import UserInvestment from "../../models/userInvestment.model.js";
import Wallet from "../../models/wallet.model.js";

export const calculateDailyROI = (amount, roiPercentage, durationDays) => {
  const totalROI = amount * (roiPercentage / 100);
  return totalROI / durationDays;
};

export const processInvestments = async () => {
    try {
        const activeInvestments = await UserInvestment.find({ status: "active" }).populate("plan");

        for (const investment of activeInvestments) {
            const { user, plan, amount, maturityDate, accruedInterest } = investment;

            const investedAmount = parseFloat(amount.toString());
            const accrued = parseFloat(accruedInterest.toString());

            const planDuration =
                plan.duration.unit === "days"
                ? plan.duration.value
                : plan.duration.unit === "months"
                ? plan.duration.value * 30
                : plan.duration.value * 365;

            const dailyROI = calculateDailyROI(investedAmount, plan.interest, planDuration);

            // Update investment accruedInterest
            investment.accruedInterest = mongoose.Types.Decimal128.fromString(
                (accrued + dailyROI).toString()
            );

            const today = new Date();
            const wallet = await Wallet.findOne({ user });
            if (!wallet) continue;

            const available = parseFloat(wallet.availableBalance?.toString() || "0");
            const invested = parseFloat(wallet.investedBalance?.toString() || "0");
            const totalEarnings = parseFloat(wallet.totalEarnings?.toString() || "0");
            const walletAccrued = parseFloat(wallet.accruedInterest?.toString() || "0");

            if (today >= maturityDate) {
                // Investment matured
                investment.status = "completed";

                wallet.availableBalance = mongoose.Types.Decimal128.fromString(
                    (available + investedAmount + (accrued + dailyROI)).toString()
                );
                wallet.investedBalance = mongoose.Types.Decimal128.fromString(
                    (invested - investedAmount).toString()
                );
                wallet.totalEarnings = mongoose.Types.Decimal128.fromString(
                    (totalEarnings + (accrued + dailyROI)).toString()
                );

                // Reset accrued interest since funds are settled
                wallet.accruedInterest = mongoose.Types.Decimal128.fromString("0");
            } else {
                // Still active → keep adding to accruedInterest + totalEarnings
                wallet.accruedInterest = mongoose.Types.Decimal128.fromString(
                    (walletAccrued + dailyROI).toString()
                );
                wallet.totalEarnings = mongoose.Types.Decimal128.fromString(
                    (totalEarnings + dailyROI).toString()
                );
            }

            // ✅ calculate avgROI for this user’s active investments
            const userActiveInvestments = await UserInvestment.find({ user, status: "active" });

            let totalActiveInvested = 0;
            let totalAccrued = 0;

            for (const inv of userActiveInvestments) {
                totalActiveInvested += parseFloat(inv.amount.toString());
                totalAccrued += parseFloat(inv.accruedInterest.toString());
            }

            
            let avgROI = 0;
            if (totalActiveInvested > 0) {
                avgROI = (totalAccrued / totalActiveInvested) * 100;
            }
            
            console.log("Total Invested:", totalActiveInvested);
            console.log("Total Accrued:", totalAccrued);
            console.log('average',avgROI)

            wallet.avgROI = mongoose.Types.Decimal128.fromString(avgROI.toFixed(2));

            wallet.lastTransactionAt = today;
            await wallet.save();
            await investment.save();
        }
    } catch (error) {
        console.error("Error in investment processing:", error);
    }
};

const monitorInvestment = () => {
    cron.schedule("0 0 * * *", async () => {
        await processInvestments();
    });
};

export default monitorInvestment;