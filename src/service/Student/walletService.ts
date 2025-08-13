import {IWallet, IWalletRepository, IWalletService } from "../../interface/IWallet";
import walletRepository from "../../repositories/student/walletRepository";
import mongoose from "mongoose";

interface Transaction {
  _id: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  transactionType: "credit" | "debit";
  date: Date;
  enrolledId: string;
}

export class WalletService implements IWalletService{
  private walletRepository: IWalletRepository;
  
      constructor(
          tutorRepository: IWalletRepository
      ){
          this.walletRepository = tutorRepository
    }

    async getAllWallet(userId: string): Promise<IWallet> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error(`Invalid userId: ${userId}`);
        throw new Error("Invalid user ID");
      }

      console.log(`Service: Fetching wallet for userId: ${userId}`);
      let wallet = await this.walletRepository.getWallet(userId);
      if (!wallet) {
        console.log(`Wallet not found for userId: ${userId}, creating new wallet`);
        await this.walletRepository.createWallet(userId);
        wallet = await this.walletRepository.getWallet(userId);
        if (!wallet) {
          console.error(`Failed to create wallet for userId: ${userId}`);
          throw new Error("Failed to create wallet");
        }
      }

      console.log(`Wallet fetched:`, JSON.stringify(wallet, null, 2));
      return wallet;
    } catch (error: any) {
      console.error("Service: Error in getAllWallet:", {
        message: error.message,
        userId,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch wallet: ${error.message}`);
    }
  }

  async checkBalance(userId: string, amount: number): Promise<IWallet | null> {
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
      const wallet = await this.walletRepository.getWallet(userId);
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
    } catch (error: any) {
      console.error("Service: Error in checkBalance:", {
        message: error.message,
        userId,
        amount,
        stack: error.stack,
      });
      throw new Error(`Failed to check balance: ${error.message}`);
    }
  }

  async wallet_payment(data: { userId: string; amount: number }): Promise<{
    success: boolean;
    message: string;
    wallet: IWallet | null;
  }> {
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
      const wallet = await this.walletRepository.getWallet(data.userId);
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
    } catch (error: any) {
      console.error("Service: Error in wallet_payment:", {
        message: error.message,
        userId: data.userId,
        amount: data.amount,
        stack: error.stack,
      });
      throw new Error(`Failed to check wallet balance: ${error.message}`);
    }
  }

  async debitWallet(enrolledId: string, userId: string, amount: number, reason: string): Promise<null> {
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
      await this.walletRepository.debitWallet(enrolledId, userId, amount, reason);
      
      console.log(`Wallet debited successfully for userId: ${userId}`);
      return null;
    } catch (error: any) {
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
  }
  
}


export default new WalletService(walletRepository)