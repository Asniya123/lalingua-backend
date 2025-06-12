import { Request, Response } from "express";
import { ObjectId, Document, Schema, Types, FilterQuery } from "mongoose";
import { ILanguage } from "./ILanguage.js";
import { ITutor } from "./ITutor.js";
import { ITutorDisplay } from "./ICourse.js";
import { IReview } from "./IReview.js";

export interface IStudent extends Document {
    username: any;
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
    comparePassword(candidatePassword: string): Promise<boolean>;
    enrollments?: IEnrollment[];
}


export interface IEnrollment {
    paymentAmount: number;
    courseId: Types.ObjectId; 
    paymentId: string;
    orderId: string; 
    amount: number; 
    currency: string; 
    status: 'pending' | 'completed' | 'failed';
    enrolledAt: Date; 
    
  }

  export interface IEnrolledCourse {
    _id: string | Types.ObjectId;
    courseTitle: string;
    description?: string;
    imageUrl?: string;
    pricePaid?: number;
    enrolledDate?: string;
    status?: string;
    tutor?: ITutorDisplay; 
    review?: IReview;
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
        mobile: number;
        profilePicture?: string
        is_blocked: boolean | undefined
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
    update(studentId: string, data: Partial<IStudent> | { $pull: any }): Promise<IStudent | null>
    getUsers(page: number, limit: number, search?: string): Promise<{ users: IStudent[], total: number }>
    create(data: Partial<IStudent>): Promise<IStudent | null>; 
    findByEmail(email: string): Promise<IStudent | null>;
    findById(id: string): Promise<IStudent | null>;
    createOtp(data: Partial<IStudent>): Promise<IStudent | null>; 
    findByEmailOtp(email: string): Promise<IStudent | null>;
    updateOtp(email: string, otp: string, expiresAt: Date): Promise<IStudent | null>;
    updatePasswordAndClearOtp(email: string, password: string): Promise<IStudent | null>;
    
    getStudentProfile(studentId: string): Promise<IStudent | null>
    updateStudentProfile(studentId: string, profileData: any): Promise<IStudent | null >
    uploadProfilePicture(studentId: string, profilePicture: string): Promise<IStudent | null>;
    changePassword(studentId: string,newPassword: string): Promise<IStudent | null>;
    
    findGoogleId(googleId: string): Promise<IStudent | null>
    
    updateEnrollments(studentId: string, enrollmentData: IEnrollment): Promise<IStudent | null>

    getContact(query: FilterQuery<IStudent>, userId: string | undefined): Promise<IStudent[] | null>
}

export interface IStudentService {
    registerStudent(studentData: Partial<IStudent> & { confirmPassword?: string }): Promise<IStudent | null>  
    generateOtp(email: string): Promise<string>;
    verifyOtp(email: string, otp: string): Promise<IStudent | null>;
    resendOtp(email: string): Promise<IStudent | null>;
    
    googlesignIn(studentData: googleUserData,): Promise<{student: IStudent; accessToken: string; refreshToken: string} >
    login(email: string, password: string): Promise<ILogin>;
    
    getStudentProfile(studentId: string): Promise<IStudent | null>
    updateStudentProfile(studentId: string,profileData: { name: string; email: string; mobile: string }): Promise<IStudent | null>; 
    uploadProfilePicture(studentId: string, profilePicture: string): Promise<IStudent | null>
    changePassword(studentId: string, currentPassword: string, newPassword: string): Promise<IStudent | null>;

    forgotPassword(email: string): Promise<void>
    resetPassword(email: string, otp: string, newPassword: string): Promise<IStudent | null>

    getLanguages(): Promise<ILanguage[]>;
}

export interface IStudentController {
    registerStudent(req: Request, res: Response): Promise<void>;
    verifyOtp(req: Request, res: Response): Promise<void>;
    resendOtp(req: Request, res: Response): Promise<void>;
    
    googlesignIn(req: Request, res: Response): Promise<void>
    login(req: Request, res: Response): Promise<void>;
    
    getStudentProfile(req: AuthenticatedRequest, res: Response): Promise<void>
    updateStudentProfile(req: AuthenticatedRequest, res: Response): Promise<void>
    uploadProfilePicture(req: Request, res: Response): Promise<void>
    changePassword(req: Request, res: Response): Promise<void>;

    forgotPassword(req: Request, res: Response): Promise<void>
    resetPassword(req: Request, res: Response): Promise<void>

    getLanguages(req: Request, res: Response): Promise<void>;
}



