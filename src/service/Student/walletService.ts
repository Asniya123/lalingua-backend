import {IWallet, IWalletRepository, IWalletService } from "../../interface/IWallet.js";
import walletRepository from "../../repositories/student/walletRepository.js";
import { CustomError } from "../../domain/errors/customError.js";
import HttpStatusCode from "../../domain/enum/httpstatus.js";
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

    async getAllWallet(user_id: string): Promise<IWallet> {
      try {
        let wallet = await this.walletRepository.getWallet(user_id);
        if (!wallet) {
          
          await this.walletRepository.createWallet(user_id);
          wallet = await this.walletRepository.getWallet(user_id);
          if (!wallet) {
            throw new CustomError("Failed to create wallet", HttpStatusCode.INTERNAL_SERVER_ERROR);
          }
        }
        return wallet;
      } catch (error) {
        console.error("Error in getAllWallet:", error);
        throw error instanceof CustomError
          ? error
          : new CustomError("Failed to fetch wallet", HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
    
    

    async checkBalance(user_id: string, amount: number): Promise<IWallet | null> {
      const wallet = await this.walletRepository.getWallet(user_id);
      if (!wallet) {
        throw new CustomError("Wallet Not Found", HttpStatusCode.NOT_FOUND);
      }
      if (wallet.walletBalance < amount) {
        throw new CustomError("Insufficient Balance", HttpStatusCode.BAD_REQUEST);
      }
      return wallet;
    }


    async wallet_payment(data: { userId: string; amount: number }): Promise<{ success: boolean; message: string; wallet: IWallet | null }> {
      try {
        const wallet = await this.walletRepository.getWallet(data.userId);
        if (!wallet) {
          return { success: false, message: "Wallet not found", wallet: null };
        }
        if (data.amount > 0 && wallet.walletBalance < data.amount) {
          return { success: false, message: "Insufficient wallet balance", wallet };
        }
        return { success: true, message: "Wallet balance sufficient", wallet };
      } catch (error) {
        throw new CustomError("Failed to check wallet balance", HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
  
    async debitWallet(enrolledId: string, userId: string, amount: number, reason: string): Promise<null> {
      try {
        await this.walletRepository.debitWallet(enrolledId, userId, amount, reason);
        return null;
      } catch (error) {
        throw error instanceof CustomError ? error : new CustomError("Failed to debit wallet", HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
    
  
}


export default new WalletService(walletRepository)