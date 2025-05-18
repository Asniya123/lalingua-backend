import { Types } from "mongoose";
import { Request, Response } from "express";

export interface IPurchase extends Document {
    _id: string;
    userId: string | Types.ObjectId;
    courseId: string | Types.ObjectId;
    courseTitle: string;
    amount: number;
    purchaseDate: Date;
    status: 'completed' | 'refund' | 'pending' | 'failed';
    tutor?: {
      _id: string;
      name: string;
      profilePicture: string;
    };
  }


export interface IPurchaseRepository{
    findByUserId(userId: any): Promise<IPurchase[]>
}


export interface IPurchaseService{
    getPurchaseHistory(userId: any): Promise<IPurchase[]>
}


export interface IPurchaseController{
    getPurchaseHistory(req: Request, res: Response): Promise<void>
}