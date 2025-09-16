import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import Wallet from "../models/wallet.model.js";

export const handleDepositApproval = async (transactionId, approved, adminId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const txn = await Transaction.findById(transactionId).session(session);
    if (!txn || txn.type !== "deposit") {
      throw new Error("Invalid deposit transaction");
    }
    if (txn.status !== "pending") {
      throw new Error("Deposit already processed");
    }

    const wallet = await Wallet.findOne({ user: txn.user }).session(session);
    if (!wallet) throw new Error("Wallet not found");

    // Convert safely (default 0 if missing)
    const pending = parseFloat(wallet.pendingDeposits?.toString() || "0");
    const available = parseFloat(wallet.availableBalance?.toString() || "0");
    const amount = Number(txn.amount);

    if (approved) {
      txn.status = "accepted";
      txn.approvedBy = adminId;

      wallet.pendingDeposits = mongoose.Types.Decimal128.fromString(
        Math.max(pending - amount, 0).toString()
      );
      wallet.availableBalance = mongoose.Types.Decimal128.fromString(
        (available + amount).toString()
      );
    } else {
      txn.status = "rejected";
      txn.approvedBy = adminId;

      wallet.pendingDeposits = mongoose.Types.Decimal128.fromString(
        Math.max(pending - amount, 0).toString()
      );
    }

    await txn.save({ session });
    await wallet.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { success: true, message: `Deposit ${approved ? "approved" : "rejected"} successfully.` };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(" Error handling deposit approval:", error);
    return { success: false, message: error.message };
  }
};
