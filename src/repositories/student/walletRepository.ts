import mongoose, { Types } from "mongoose";
import { IWallet, IWalletRepository } from "../../interface/IWallet.js";
import WalletModel from "../../models/walletModel.js";



interface Transaction {
  enrolledId: string;
  date: Date;
  amount: number;
  transactionType: "credit" | "debit";
  reason?: string | null | undefined;
}

class walletReposiotry implements IWalletRepository{
 async createWallet(userId: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error(`Invalid userId: ${userId}`);
        throw new Error("Invalid user ID");
      }

      console.log(`Repository: Creating wallet for userId: ${userId}`);
      const newWallet = await WalletModel.create({
        wallet_user: userId,
        walletBalance: 0,
        transaction: [],
      });

      if (!newWallet) {
        console.error(`Failed to create wallet for userId: ${userId}`);
        throw new Error("Failed to create wallet");
      }

      console.log(`Wallet created successfully for userId: ${userId}`);
    } catch (error) {
      console.error("Repository: Error creating wallet:", {
        message: error instanceof Error ? error.message : String(error),
        userId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getWallet(userId: string): Promise<IWallet | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error(`Invalid userId: ${userId}`);
        throw new Error("Invalid user ID");
      }

      console.log(`Repository: Fetching wallet for userId: ${userId}`);
      const wallet: IWallet | null = await WalletModel.findOne({
        wallet_user: userId,
      });

      console.log(`Wallet fetched: ${wallet ? JSON.stringify(wallet, null, 2) : "null"}`);
      return wallet;
    } catch (error) {
      console.error("Repository: Error fetching wallet:", {
        message: error instanceof Error ? error.message : String(error),
        userId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Failed to fetch wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refundWallet(enrolledId: string, userId: string, amount: number, reason: string): Promise<IWallet | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error(`Invalid userId: ${userId}`);
        throw new Error("Invalid user ID");
      }
      if (!mongoose.Types.ObjectId.isValid(enrolledId)) {
        console.error(`Invalid enrolledId: ${enrolledId}`);
        throw new Error("Invalid enrollment ID");
      }
      if (typeof amount !== "number" || amount <= 0) {
        console.error(`Invalid amount: ${amount}`);
        throw new Error("Invalid refund amount");
      }
      if (!reason || typeof reason !== "string" || reason.trim() === "") {
        console.error(`Invalid reason: ${reason}`);
        throw new Error("Valid reason is required");
      }

      const amountInRupees = amount;
      const newTransaction = {
        enrolledId: enrolledId.trim(),
        date: new Date(),
        amount: amountInRupees,
        transactionType: "credit" as const,
        reason: reason.trim(),
      };

      console.log(`Repository: Refunding wallet for userId: ${userId}, amount: ${amountInRupees}, reason: ${reason}`);
      const updatedWallet = await WalletModel.findOneAndUpdate(
        { wallet_user: userId },
        {
          $inc: { walletBalance: amountInRupees },
          $push: { transaction: newTransaction },
        },
        { new: true }
      );

      if (!updatedWallet) {
        console.error(`Wallet not found for userId: ${userId}`);
        throw new Error("Wallet not found");
      }

      console.log(`Wallet refunded successfully: ${JSON.stringify(updatedWallet, null, 2)}`);
      return updatedWallet;
    } catch (error) {
      console.error("Repository: Error refunding wallet:", {
        message: error instanceof Error ? error.message : String(error),
        userId,
        enrolledId,
        amount,
        reason,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Failed to refund wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addAdminWallet(enrolledId: string, adminId: string, amount: number, reason: string): Promise<IWallet | null> {
    const newTransaction: Transaction = {
      enrolledId,
      date: new Date(), 
      amount,
      transactionType: "credit",
      reason,
    };
    const updatedWallet = await WalletModel.findOneAndUpdate( 
      { wallet_user: adminId },
      {
        $inc: { walletBalance: amount },
        $push: { transaction: newTransaction },
      },
      { new: true }
    );
    return updatedWallet as unknown as IWallet;
  }


  async debitWallet(enrolledId: string, userId: string | undefined, amount: number, reason: string): Promise<void> {
    const newTransaction: Transaction = {
      enrolledId,
      date: new Date(), 
      amount,
      transactionType: "debit",
      reason,
    };
    await WalletModel.updateOne(
      { wallet_user: userId },
      {
        $inc: { walletBalance: -amount },
        $push: { transaction: newTransaction },
      }
    );
  }


  async WalletData(): Promise<{ _id: number; totalTransactions: number; }[]> {
    try {
      const year = new Date().getFullYear();
      const walletTransactions = await WalletModel.aggregate([
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
    } catch (error) {
      throw error;
    }
  }


  async getWalletData(tutorId: string): Promise<{ _id: number; totalTransactions: number; }[]> {
    try {
      const year = new Date().getFullYear();
      const walletTransactions = await WalletModel.aggregate([
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
    } catch (error) {
      throw error;
    }
  }


  
  
}


export default new walletReposiotry