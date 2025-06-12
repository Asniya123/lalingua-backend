import { Schema, model } from 'mongoose';
const walletSchema = new Schema({
    wallet_user: { type: Schema.Types.ObjectId, required: true },
    walletBalance: { type: Number, default: 0 },
    transaction: [
        {
            amount: { type: Number, required: true },
            enrolledId: { type: String, required: true },
            reason: { type: String },
            transactionType: {
                type: String,
                enum: ["credit", "debit"],
                required: true,
            },
            date: { type: Date, default: new Date() },
        },
    ],
}, {
    timestamps: true,
});
const WalletModel = model('Wallet', walletSchema);
export default WalletModel;
