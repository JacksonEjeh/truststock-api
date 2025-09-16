import mongoose from "mongoose";
import Transaction from '../../models/transaction.model.js';
import Wallet from '../../models/wallet.model.js';


export const calculateROI = (amount, roiPercentage, durationDays) => {
    const dailyROI = (roiPercentage / 100) / 365; 
    return amount * dailyROI * durationDays; 
};

// Updates wallet earnings for a specific user by calculating ROIbased on days since last ROI credit.
export const updateWalletEarnings = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
        const transactions = await Transaction.find({
        user: userId,
        type: "deposit",
        status: "accepted",
        investmentPlan: { $exists: true, $ne: null }
        }).session(session);


    for (const txn of transactions) {
      // Stop ROI if investment has matured
      const durationDays = Math.floor((Date.now() - txn.date) / (1000 * 60 * 60 * 24));
      if (durationDays > txn.investmentDuration) continue;

      // Find how many new days have passed since last ROI credit
      const lastCreditedAt = txn.lastRoiCreditedAt || txn.date;
      const newDurationDays = Math.floor((Date.now() - lastCreditedAt) / (1000 * 60 * 60 * 24));
      if (newDurationDays <= 0) continue;

      // Calculate ROI only for the new days
      const roiAmount = calculateROI(txn.amount, txn.returnOnInvestment, newDurationDays);

      if (roiAmount > 0) {
        const wallet = await Wallet.findOne({ user: userId }).session(session);
        if (!wallet) continue;

        // Safely update Decimal128 fields
        const currentEarnings = parseFloat(wallet.totalEarnings.toString());
        const currentAvailable = parseFloat(wallet.availableBalance.toString());

        wallet.totalEarnings = mongoose.Types.Decimal128.fromString(
          (currentEarnings + roiAmount).toString()
        );
        wallet.availableBalance = mongoose.Types.Decimal128.fromString(
          (currentAvailable + roiAmount).toString()
        );

        await wallet.save({ session });

        // Update last credited date for this transaction
        txn.lastRoiCreditedAt = new Date();
        await txn.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    console.log(` ROI updated successfully for user ${userId}`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(` Error updating ROI for user ${userId}:`, error);
  }
};
