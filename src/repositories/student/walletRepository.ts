import { Types } from "mongoose";
import { IWallet, IWalletRepository } from "../../interface/IWallet.js";
import WalletModel from "../../models/walletModel.js";
import { CustomError } from "../../domain/errors/customError.js";
import HttpStatusCode from "../../domain/enum/httpstatus.js";


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
      const newWallet = await WalletModel.create({
        wallet_user: userId,
        walletBalance: 0,
        transaction: [],
      });
      if (!newWallet) {
        throw new Error("Failed to create wallet");
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw new CustomError("Failed to create wallet", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getWallet(userId: string): Promise<IWallet | null> {
    try {
      const wallet: IWallet | null = await WalletModel.findOne({
        wallet_user: userId,
      });
      return wallet;
    } catch (error) {
      console.error("Error fetching wallet:", error);
      throw new CustomError("Failed to fetch wallet", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async refundWallet(enrolledId: string, userId: string, amount: number, reason: string): Promise<IWallet | null> {
    try {
      if (!enrolledId || !userId || !amount || !reason) {
        throw new CustomError('Missing required fields', HttpStatusCode.BAD_REQUEST);
      }
      if (typeof enrolledId !== 'string' || enrolledId.trim() === '') {
        throw new CustomError('Invalid enrollment ID', HttpStatusCode.BAD_REQUEST);
      }
  
      const validatedAmount = Number(amount);
      if (isNaN(validatedAmount) || validatedAmount <= 0) {
        throw new CustomError('Invalid refund amount', HttpStatusCode.BAD_REQUEST);
      }
      const amountInRupees = validatedAmount; // No conversion if enrollment.amount is in rupees
  
      const newTransaction = {
        enrolledId: enrolledId.trim(),
        date: new Date(),
        amount: amountInRupees,
        transactionType: 'credit',
        reason: reason.trim() || 'No reason provided',
      };
  
      
  
      const updatedWallet = await WalletModel.findOneAndUpdate(
        { wallet_user: userId },
        {
          $inc: { walletBalance: amountInRupees },
          $push: { transaction: newTransaction },
        },
        { new: true }
      );
  
      if (!updatedWallet) {
        throw new CustomError('Wallet not found for the given user', HttpStatusCode.NOT_FOUND);
      }
  
      return updatedWallet as unknown as IWallet;
    } catch (error) {
      console.error('Failed to refund wallet:', error);
      throw error;
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