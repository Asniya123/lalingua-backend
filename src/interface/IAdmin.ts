import { Document, ObjectId } from "mongoose";
import { Request, Response } from "express";

export interface IAdmin extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  
}

export interface ILogin {
  adminId: string;
  accessToken: string;
  refreshToken: string;
}

export interface IAdminRepository {
  findByEmail(email: string | undefined): Promise<IAdmin | null>;
}

export interface IAdminService {
  login(email: string, password: string): Promise<ILogin>;
  getUsers(): Promise<IAdmin[]>;  
  blockUnblock(userId: string, isBlocked: boolean): Promise<any>
  getTutors(): Promise<IAdmin[]>;  
  tutorManagement(tutorId: string, isBlocked: boolean): Promise<any>
  getAllTutors(): Promise<IAdmin[]>
  updateTutorStatus(tutorId: string, status: 'approved' | 'rejected', reason?: string): Promise<{ success: boolean; message: string }>
}

export interface IAdminController {
  login(req: Request, res: Response): Promise<void>;
  getUsers(req: Request, res: Response): Promise<void>;  
  blockUnblock(req: Request, res: Response): Promise<void>
  getTutors(req: Request, res: Response): Promise<void>;  
  tutorManagement(req: Request, res: Response): Promise<void>
  getAllTutors(req: Request, res: Response): Promise<void>
  updateTutorStatus(req: Request, res: Response): Promise<void>
}
