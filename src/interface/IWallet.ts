import {  Request, Response } from "express";
import { Document, Types } from 'mongoose';



export interface IWallet extends Document {
  _id: string;
  wallet_user: string;
  walletBalance: number;
  transaction: {
    enrolledId: string;
    date: Date;
    amount: number;
    transactionType: "credit" | "debit";
    reason?: string | null;
  }[];
}

interface Transaction {
  enrolledId: string;
  date: Date;
  amount: number;
  transactionType: "credit" | "debit";
  reason?: string | null | undefined;
}

export interface IWalletRepository{
  createWallet(userId: string): Promise<void>
  getWallet(userId: string): Promise<IWallet | null> 
  refundWallet( enrolledId: string, userId: string, amount: number, reason: string ): Promise<IWallet | null>
  addAdminWallet( enrolledId: string, adminId: string, amount: number, reason: string): Promise<IWallet | null> 
  debitWallet(
    enrolledId: string,
    userId: string | undefined,
    amount: number,
    reason: string
  ): Promise<void>
  getWalletData(tutorId: string): Promise<
    {
      _id: number; 
      totalTransactions: number;
    }[]
  > 
  WalletData(): Promise<
  {
    _id: number; 
    totalTransactions: number;
  }[]
>;

}


export interface IWalletService{
  getAllWallet(user_id: string): Promise<IWallet>
  checkBalance(user_id: string, amount: number): Promise<IWallet | null>
  wallet_payment(data: { userId: string; amount: number }): Promise<{ success: boolean; message: string; wallet: IWallet | null }>
  debitWallet(enrolledId: string, userId: string, amount: number, reason: string): Promise<null>
}


export interface IWalletController {
  getAllWallet(req: Request, res: Response): Promise<void>
  checkBalance(req: Request, res: Response): Promise<void>
}
