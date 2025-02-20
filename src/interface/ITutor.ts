import { ObjectId, Document } from "mongoose";
import { Request, Response } from 'express'

export interface ITutor extends Document {
    _id: ObjectId;
    name: string;
    email: string;
    mobile: number;
    password: string;
    otp: string;
    expiresAt: Date;
    isVerified: boolean;
    googleId?: string;
    documents?: string;
    is_blocked: boolean;
    status: 'pending' | 'approved' | 'rejected'
    
}

export interface ILogin{
    accessToken: string;
    refreshToken: string;
    tutor: {
        _id: ObjectId;
        name: string;
        email: string;
        status: 'pending' | 'approved' | 'rejected'; 
        is_blocked:boolean
    }
}


export interface googleTutorData {
    documents: never[];
    uid: any;
    googleId: string;
    email: string;
    name: string;
    profilePicture?: string;
}

export interface ITutorRepository {
     getTutors():Promise<ITutor[]>;
    getAllTutors(): Promise<ITutor[]>
    create(data: Partial<ITutor>): Promise<ITutor | null>
    findByEmail(email: string|undefined): Promise<ITutor | null >
    findById(id: string): Promise<ITutor | null >
    createOtp(data: Partial<ITutor>): Promise<ITutor | null >
    findByEmailOtp(email: string | undefined): Promise<ITutor | null >
    updateOtp(email: string, otp: string, expiresAt: Date): Promise<ITutor |  null>
    findGoogleId(googleId: string): Promise<ITutor | null>
}


export interface ITutorService {
    registerTutor(data: Partial<ITutor> & { confirmPassword?: string }): Promise<ITutor | null >
    generateOtp(email: string): Promise<string>
    verifyOtp(email: string, otp: string): Promise<ITutor | null >
    resendOtp(email: string): Promise<ITutor | null >
    googlesignIn(tutorData: googleTutorData,): Promise<{tutor: ITutor; accessToken: string;refreshToken: string} >
    login(email: string, password: string): Promise<ILogin >

}


export  interface ITutorController{
    registerTutor(req: Request, res: Response): Promise<void>
    verifyOtp(req: Request, res: Response): Promise<void>
    resendOtp(req: Request, res: Response): Promise<void>
    googlesignIn(req: Request, res: Response): Promise<void>
    login(req: Request, res: Response): Promise<void>
}


