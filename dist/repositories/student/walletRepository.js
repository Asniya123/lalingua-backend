var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from "mongoose";
import WalletModel from "../../models/walletModel.js";
class walletReposiotry {
    createWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    console.error(`Invalid userId: ${userId}`);
                    throw new Error("Invalid user ID");
                }
                console.log(`Repository: Creating wallet for userId: ${userId}`);
                const newWallet = yield WalletModel.create({
                    wallet_user: userId,
                    walletBalance: 0,
                    transaction: [],
                });
                if (!newWallet) {
                    console.error(`Failed to create wallet for userId: ${userId}`);
                    throw new Error("Failed to create wallet");
                }
                console.log(`Wallet created successfully for userId: ${userId}`);
            }
            catch (error) {
                console.error("Repository: Error creating wallet:", {
                    message: error instanceof Error ? error.message : String(error),
                    userId,
                    stack: error instanceof Error ? error.stack : undefined,
                });
                throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    getWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    console.error(`Invalid userId: ${userId}`);
                    throw new Error("Invalid user ID");
                }
                console.log(`Repository: Fetching wallet for userId: ${userId}`);
                const wallet = yield WalletModel.findOne({
                    wallet_user: userId,
                });
                console.log(`Wallet fetched: ${wallet ? JSON.stringify(wallet, null, 2) : "null"}`);
                return wallet;
            }
            catch (error) {
                console.error("Repository: Error fetching wallet:", {
                    message: error instanceof Error ? error.message : String(error),
                    userId,
                    stack: error instanceof Error ? error.stack : undefined,
                });
                throw new Error(`Failed to fetch wallet: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    refundWallet(paymentId, userId, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    console.error(`Invalid userId: ${userId}`);
                    throw new Error('Invalid user ID');
                }
                if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
                    console.error(`Invalid paymentId: ${paymentId}`);
                    throw new Error('Invalid payment ID');
                }
                if (typeof amount !== 'number' || amount <= 0) {
                    console.error(`Invalid amount: ${amount}`);
                    throw new Error('Invalid refund amount');
                }
                if (!reason || typeof reason !== 'string' || reason.trim() === '') {
                    console.error(`Invalid reason: ${reason}`);
                    throw new Error('Valid reason is required');
                }
                const amountInRupees = amount;
                const newTransaction = {
                    enrolledId: paymentId.trim(),
                    date: new Date(),
                    amount: amountInRupees,
                    transactionType: 'credit',
                    reason: reason.trim(),
                };
                console.log(`Repository: Attempting to refund wallet for userId: ${userId}, amount: ${amountInRupees}, reason: ${reason}`);
                // Check if wallet exists; if not, create one
                let wallet = yield WalletModel.findOne({ wallet_user: userId });
                if (!wallet) {
                    console.log(`No wallet found for userId: ${userId}. Creating new wallet.`);
                    wallet = yield WalletModel.create({
                        wallet_user: userId,
                        walletBalance: 0,
                        transaction: [],
                    });
                }
                // Update wallet with refund
                const updatedWallet = yield WalletModel.findOneAndUpdate({ wallet_user: userId }, {
                    $inc: { walletBalance: amountInRupees },
                    $push: { transaction: newTransaction },
                }, { new: true });
                if (!updatedWallet) {
                    console.error(`Failed to update wallet for userId: ${userId}`);
                    throw new Error('Failed to update wallet');
                }
                console.log(`Wallet refunded successfully: ${JSON.stringify(updatedWallet, null, 2)}`);
                return updatedWallet;
            }
            catch (error) {
                console.error('Repository: Error refunding wallet:', {
                    message: error instanceof Error ? error.message : String(error),
                    userId,
                    paymentId,
                    amount,
                    reason,
                    stack: error instanceof Error ? error.stack : undefined,
                });
                throw new Error(`Failed to refund wallet: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    addAdminWallet(enrolledId, adminId, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(adminId)) {
                    throw new Error("Invalid admin ID");
                }
                const newTransaction = {
                    enrolledId,
                    date: new Date(),
                    amount,
                    transactionType: "credit",
                    reason,
                };
                return yield WalletModel.findOneAndUpdate({ wallet_user: adminId }, {
                    $inc: { walletBalance: amount },
                    $push: { transaction: newTransaction },
                }, { new: true });
            }
            catch (error) {
                console.error("Repository: Error adding to admin wallet:", error);
                throw new Error(`Failed to add to admin wallet: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    addTutorWallet(enrolledId, tutorId, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(tutorId)) {
                    throw new Error("Invalid tutor ID");
                }
                const newTransaction = {
                    enrolledId,
                    date: new Date(),
                    amount,
                    transactionType: "credit",
                    reason,
                };
                return yield WalletModel.findOneAndUpdate({ wallet_user: tutorId }, {
                    $inc: { walletBalance: amount },
                    $push: { transaction: newTransaction },
                }, { new: true });
            }
            catch (error) {
                console.error("Repository: Error adding to tutor wallet:", error);
                throw new Error(`Failed to add to tutor wallet: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    debitWallet(enrolledId, userId, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const newTransaction = {
                enrolledId,
                date: new Date(),
                amount,
                transactionType: "debit",
                reason,
            };
            yield WalletModel.updateOne({ wallet_user: userId }, {
                $inc: { walletBalance: -amount },
                $push: { transaction: newTransaction },
            });
        });
    }
    WalletData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const year = new Date().getFullYear();
                const walletTransactions = yield WalletModel.aggregate([
                    {
                        $unwind: "$transaction",
                    },
                    {
                        $match: {
                            "transaction.transactionType": "credit",
                            "transaction.date": {
                                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                                $lte: new Date(`${year}-12-31T23:59:59.999Z`),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: { $month: "$transaction.date" },
                            totalTransactions: { $sum: "$transaction.amount" },
                        },
                    },
                ]);
                return walletTransactions;
            }
            catch (error) {
                throw error;
            }
        });
    }
    getWalletData(tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const year = new Date().getFullYear();
                const walletTransactions = yield WalletModel.aggregate([
                    {
                        $unwind: "$transaction",
                    },
                    {
                        $match: {
                            wallet_user: tutorId,
                            "transaction.transactionType": "credit",
                            "transaction.date": {
                                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                                $lte: new Date(`${year}-12-31T23:59:59.999Z`),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: { $month: "$transaction.date" },
                            totalTransactions: { $sum: "$transaction.amount" },
                        },
                    },
                ]);
                return walletTransactions;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
export default new walletReposiotry;
