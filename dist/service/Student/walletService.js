var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import walletRepository from "../../repositories/student/walletRepository.js";
import mongoose from "mongoose";
export class WalletService {
    constructor(tutorRepository) {
        this.walletRepository = tutorRepository;
    }
    getAllWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    console.error(`Invalid userId: ${userId}`);
                    throw new Error("Invalid user ID");
                }
                console.log(`Service: Fetching wallet for userId: ${userId}`);
                let wallet = yield this.walletRepository.getWallet(userId);
                if (!wallet) {
                    console.log(`Wallet not found for userId: ${userId}, creating new wallet`);
                    yield this.walletRepository.createWallet(userId);
                    wallet = yield this.walletRepository.getWallet(userId);
                    if (!wallet) {
                        console.error(`Failed to create wallet for userId: ${userId}`);
                        throw new Error("Failed to create wallet");
                    }
                }
                console.log(`Wallet fetched:`, JSON.stringify(wallet, null, 2));
                return wallet;
            }
            catch (error) {
                console.error("Service: Error in getAllWallet:", {
                    message: error.message,
                    userId,
                    stack: error.stack,
                });
                throw new Error(`Failed to fetch wallet: ${error.message}`);
            }
        });
    }
    checkBalance(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    console.error(`Invalid userId: ${userId}`);
                    throw new Error("Invalid user ID");
                }
                if (typeof amount !== "number" || amount < 0) {
                    console.error(`Invalid amount: ${amount}`);
                    throw new Error("Invalid amount");
                }
                console.log(`Service: Checking balance for userId: ${userId}, amount: ${amount}`);
                const wallet = yield this.walletRepository.getWallet(userId);
                if (!wallet) {
                    console.error(`Wallet not found for userId: ${userId}`);
                    throw new Error("Wallet not found");
                }
                if (wallet.walletBalance < amount) {
                    console.error(`Insufficient balance for userId: ${userId}, balance: ${wallet.walletBalance}, required: ${amount}`);
                    throw new Error("Insufficient balance");
                }
                console.log(`Balance sufficient:`, JSON.stringify(wallet, null, 2));
                return wallet;
            }
            catch (error) {
                console.error("Service: Error in checkBalance:", {
                    message: error.message,
                    userId,
                    amount,
                    stack: error.stack,
                });
                throw new Error(`Failed to check balance: ${error.message}`);
            }
        });
    }
    wallet_payment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(data.userId)) {
                    console.error(`Invalid userId: ${data.userId}`);
                    throw new Error("Invalid user ID");
                }
                if (typeof data.amount !== "number" || data.amount < 0) {
                    console.error(`Invalid amount: ${data.amount}`);
                    throw new Error("Invalid amount");
                }
                console.log(`Service: Checking wallet payment for userId: ${data.userId}, amount: ${data.amount}`);
                const wallet = yield this.walletRepository.getWallet(data.userId);
                if (!wallet) {
                    console.log(`Wallet not found for userId: ${data.userId}`);
                    return { success: false, message: "Wallet not found", wallet: null };
                }
                if (data.amount > 0 && wallet.walletBalance < data.amount) {
                    console.log(`Insufficient balance for userId: ${data.userId}, balance: ${wallet.walletBalance}, required: ${data.amount}`);
                    return { success: false, message: "Insufficient wallet balance", wallet };
                }
                console.log(`Wallet payment check successful:`, JSON.stringify(wallet, null, 2));
                return { success: true, message: "Wallet balance sufficient", wallet };
            }
            catch (error) {
                console.error("Service: Error in wallet_payment:", {
                    message: error.message,
                    userId: data.userId,
                    amount: data.amount,
                    stack: error.stack,
                });
                throw new Error(`Failed to check wallet balance: ${error.message}`);
            }
        });
    }
    debitWallet(enrolledId, userId, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    console.error(`Invalid userId: ${userId}`);
                    throw new Error("Invalid user ID");
                }
                if (typeof amount !== "number" || amount <= 0) {
                    console.error(`Invalid amount: ${amount}`);
                    throw new Error("Invalid amount");
                }
                if (!enrolledId || !reason) {
                    console.error(`Missing enrolledId or reason: enrolledId=${enrolledId}, reason=${reason}`);
                    throw new Error("Enrolled ID and reason are required");
                }
                console.log(`Service: Debiting wallet for userId: ${userId}, amount: ${amount}, reason: ${reason}`);
                yield this.walletRepository.debitWallet(enrolledId, userId, amount, reason);
                console.log(`Wallet debited successfully for userId: ${userId}`);
                return null;
            }
            catch (error) {
                console.error("Service: Error in debitWallet:", {
                    message: error.message,
                    userId,
                    enrolledId,
                    amount,
                    reason,
                    stack: error.stack,
                });
                throw new Error(`Failed to debit wallet: ${error.message}`);
            }
        });
    }
    creditTutorWallet(enrolledId, tutorId, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(tutorId)) {
                    throw new Error("Invalid tutor ID");
                }
                if (typeof amount !== "number" || amount <= 0) {
                    throw new Error("Invalid amount");
                }
                if (!enrolledId || !reason) {
                    throw new Error("Enrolled ID and reason are required");
                }
                return yield this.walletRepository.addTutorWallet(enrolledId, tutorId, amount, reason);
            }
            catch (error) {
                console.error("Service: Error in creditTutorWallet:", error);
                throw new Error(`Failed to credit tutor wallet: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    creditAdminWallet(enrolledId, adminId, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(adminId)) {
                    throw new Error("Invalid admin ID");
                }
                if (typeof amount !== "number" || amount <= 0) {
                    throw new Error("Invalid amount");
                }
                if (!enrolledId || !reason) {
                    throw new Error("Enrolled ID and reason are required");
                }
                return yield this.walletRepository.addAdminWallet(enrolledId, adminId, amount, reason);
            }
            catch (error) {
                console.error("Service: Error in creditAdminWallet:", error);
                throw new Error(`Failed to credit admin wallet: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
}
export default new WalletService(walletRepository);
