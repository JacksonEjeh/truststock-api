import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'BTC', 'ETH'],
        default: 'USD',
    },
    availableBalance: {
        type: Number,
        default: 0.0,
    },
    lockedBalance: {
        type: Number,
        default: 0.0,
    },
    pendingDeposits: {
        type: Number,
        default: 0.0,
    },
    pendingWithdrawals: {
        type: Number,
        default: 0.0,
    },
    totalEarnings: {
        type: Number,
        default: 0.0,
    },
    cryptoWallet: {
        BTC: { type: String, default: null},
        ETh: { type: String, default: null},
    },
    lastTransactionAt: {
        type: Date,
    }
}, {
    timestamps: true
});

walletSchema.method.getTotalValue = ()=>{
    return this.availableBalance + this.lockedBalance + this.pendingDeposits;
};

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;