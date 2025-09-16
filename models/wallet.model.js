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
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
    lockedBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
    pendingDeposits: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
    pendingWithdrawals: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
    totalEarnings: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0.0,
    },
    lastTransactionAt: {
        type: Date,
    }
}, {
    timestamps: true
});

walletSchema.set('toJSON', {
    transform: (doc, ret) => {
      ret.availableBalance = parseFloat(ret.availableBalance?.toString());
      ret.pendingDeposits = parseFloat(ret.pendingDeposits?.toString());
      ret.pendingWithdrawals = parseFloat(ret.pendingWithdrawals?.toString());
      ret.lockedBalance = parseFloat(ret.lockedBalance?.toString());
      ret.totalEarnings = parseFloat(ret.totalEarnings?.toString());
      return ret;
    }
});

walletSchema.methods.getTotalValue = function () {
    return this.availableBalance + this.lockedBalance + this.pendingDeposits;
};

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;