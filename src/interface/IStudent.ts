import { Request, Response } from "express";
import { ObjectId, Document } from "mongoose";

export interface IStudent extends Document {
    _id: ObjectId;
    name: string;
    email: string;
    mobile: number;
    password: string;
    otp: string;
    expiresAt: Date;
    isVerified: boolean;
    profilePicture?: string;
    dateOfBirth?: Date;
    googleId?: string; 
    is_blocked?: boolean
}

export interface AuthenticatedRequest extends Request{
    data: any;
    user?: {_id: string}
}

export interface ILogin {
    accessToken: string;
    refreshToken: string;
    student: {
        _id: ObjectId;
        name: string;
        email: string;
    };
}

export interface googleUserData {
    uid: any;
    googleId: string;
    email: string;
    name: string;
    profilePicture?: string;
}


export interface IStudentRepository {
    getUsers():Promise<IStudent[]>;
    create(data: Partial<IStudent>): Promise<IStudent | null>; 
    findByEmail(email: string): Promise<IStudent | null>;
    findById(id: string): Promise<IStudent | null>;
    createOtp(data: Partial<IStudent>): Promise<IStudent | null>; 
    findByEmailOtp(email: string): Promise<IStudent | null>;
    updateOtp(email: string, otp: string, expiresAt: Date): Promise<IStudent | null>;
    updatePassword(email: string, password: string): Promise<IStudent | null>;
    getStudentProfile(studentId: string): Promise<IStudent | null>
    updateStudentProfile(studentId: string, profileData: any): Promise<IStudent | null >
    findGoogleId(googleId: string): Promise<IStudent | null>
    
}

export interface IStudentService {
    registerStudent(studentData: Partial<IStudent> & { confirmPassword?: string }): Promise<IStudent | null>  
    generateOtp(email: string): Promise<string>;
    verifyOtp(email: string, otp: string): Promise<IStudent | null>;
    resendOtp(email: string): Promise<IStudent | null>;
    googlesignIn(studentData: googleUserData,): Promise<{student: IStudent; accessToken: string; refreshToken: string} >
    login(email: string, password: string): Promise<ILogin>;
    getStudentProfile(studentId: string): Promise<IStudent | null>
    updateStudentProfile(studentId: string,profileData: { name: string; email: string; phone: string }): Promise<IStudent | null>; 
}

export interface IStudentController {
    registerStudent(req: Request, res: Response): Promise<void>;
    verifyOtp(req: Request, res: Response): Promise<void>;
    resendOtp(req: Request, res: Response): Promise<void>;
    googlesignIn(req: Request, res: Response): Promise<void>
    login(req: Request, res: Response): Promise<void>;
    getStudentProfile(req: AuthenticatedRequest, res: Response): Promise<void>
    updateStudentProfile(req: AuthenticatedRequest, res: Response): Promise<void>
}
