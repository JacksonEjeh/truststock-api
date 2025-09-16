import cron from 'node-cron';
import mongoose from 'mongoose';
import Wallet from '../../models/wallet.model.js';
import { calculateROI } from './roiCalculator.js';
import Transaction from '../../models/transactionModel.js';

// Run every midnight
const monitorDeposits = () => {
    cron.schedule('0 0 * * *', async () => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Get all accepted deposits that are still active
           const transactions = await Transaction.find({
            type: "deposit",
            status: "accepted",
            investmentPlan: { $exists: true, $ne: null }
        }).session(session);


            for (const txn of transactions) {
                // Skip if investment has matured
                const durationDays = Math.floor((Date.now() - txn.date) / (1000 * 60 * 60 * 24));
                if (durationDays > txn.investmentDuration) continue;

                // Determine days since last ROI credit
                const lastCreditedAt = txn.lastRoiCreditedAt || txn.date;
                const newDurationDays = Math.floor((Date.now() - lastCreditedAt) / (1000 * 60 * 60 * 24));
                if (newDurationDays <= 0) continue; 

                // Calculate ROI only for new days
                const roi = calculateROI(txn.amount, txn.returnOnInvestment, newDurationDays);

                if (roi > 0) {
                    const wallet = await Wallet.findOne({ user: txn.user }).session(session);
                    if (!wallet) continue;

                    // Safely update Decimal128 fields
                    const currentEarnings = parseFloat(wallet.totalEarnings.toString());
                    const currentAvailable = parseFloat(wallet.availableBalance.toString());

                    wallet.totalEarnings = mongoose.Types.Decimal128.fromString((currentEarnings + roi).toString());
                    wallet.availableBalance = mongoose.Types.Decimal128.fromString((currentAvailable + roi).toString());

                    await wallet.save({ session });

                    // Update transaction to prevent double-counting
                    txn.lastRoiCreditedAt = new Date();
                    await txn.save({ session });
                }
            }

            await session.commitTransaction();
            session.endSession();
            console.log('ROI monitoring completed successfully.');
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(' Error monitoring deposits:', error);
        }
    });
};

export default monitorDeposits;
