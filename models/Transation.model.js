import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'earning', 'transfer', 'investment'],
        required: true
    },
    method: {
        type: String,
        enum: ['bank', 'crypto', 'card'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected'],
        default: 'pending'
    },
    walletAddress: String, 
    reference: { type: String, unique: true },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;