import { ObjectId, Document, FilterQuery } from "mongoose";
import { Request, Response } from 'express'

export interface ITutor extends Document {
    _id: ObjectId;
    name: string;
    email: string;
    mobile: string;
    password: string;
    otp: string;
    expiresAt: Date;
    isVerified: boolean;
    googleId?: string;
    documents?: string;
    qualification?: string;
    language?: string;
    country?: string;
    experience?: string;
    dateOfBirth?: string;
    bio: string;
    specialization?: string;
    is_blocked: boolean;
    profilePicture?: string
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
        is_blocked:boolean;
        mobile: string;
        profilePicture?: string
    }
}

interface Query {
    status?: string;
    [key: string]: any; 
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
    getTutors(page: number, limit: number, query: any, search?: string): Promise<{
  tutor: ITutor[];
  total: number;
  totalApprovedTutors: number;
}>;
    getAllTutors(search?: string): Promise<ITutor[]>
    create(data: Partial<ITutor>): Promise<ITutor | null>
    findByEmail(email: string|undefined): Promise<ITutor | null >
    findById(id: string): Promise<ITutor | null >
    createOtp(data: Partial<ITutor>): Promise<ITutor | null >
    findByEmailOtp(email: string | undefined): Promise<ITutor | null >
    updateOtp(email: string, otp: string, expiresAt: Date): Promise<ITutor |  null>
    findGoogleId(googleId: string): Promise<ITutor | null>

    getTutorProfile(tutorId: string): Promise<ITutor | null >
    updateTutorProfile(tutorId: string, updateData: Partial<ITutor>): Promise<ITutor | null>
    uploadProfilePicture(tutorId: string, profilePicture: string): Promise<ITutor | null>
    findLanguageById(languageId: string): Promise<any | null> 
    updatePasswordAndClearOtp(email: string, password: string): Promise<ITutor | null>

    changePassword(tutorId: string, newPassword:string): Promise<ITutor | null>

    getContact(query: FilterQuery<ITutor>, tutorId: string | undefined): Promise<ITutor[] | null>


}


export interface ITutorService {
    registerTutor(data: Partial<ITutor> & { confirmPassword?: string }): Promise<ITutor | null >
    generateOtp(email: string): Promise<string>
    verifyOtp(email: string, otp: string): Promise<ITutor | null >
    resendOtp(email: string): Promise<ITutor | null >
    googlesignIn(tutorData: googleTutorData,): Promise<{tutor: ITutor; accessToken: string;refreshToken: string} >
    login(email: string, password: string): Promise<ILogin >

    getTutorProfile(tutorId: string): Promise<ITutor | null >
    updateTutorProfile(tutorId: string, profileData: Partial<ITutor>): Promise<ITutor | null>
    validateLanguage(languageId: string): Promise<boolean>
    uploadProfilePicture(tutorId: string, profilePicture: string): Promise<ITutor | null >

    forgotPassword(email: string): Promise<void>
    resetPassword(email: string, otp: string, newPassword: string): Promise<ITutor>

    changePassword(tutorId: string, currentPassword: string, newPassword: string): Promise<ITutor | null>

    verifyTutor(tutorId: string): Promise<ITutor | null> 
     renewAccessToken(tutorId: string): Promise<string>
}


export  interface ITutorController{
    registerTutor(req: Request, res: Response): Promise<void>
    verifyOtp(req: Request, res: Response): Promise<void>
    resendOtp(req: Request, res: Response): Promise<void>
    googlesignIn(req: Request, res: Response): Promise<void>
    login(req: Request, res: Response): Promise<void>

    getTutorProfile(req: Request, res: Response): Promise<void>
    updateTutorProfile(req:Request, res: Response): Promise<void>
    uploadProfilePicture(req: Request, res: Response): Promise<void>

    forgotPassword(req: Request, res: Response): Promise<void>
    resetPassword(req: Request, res: Response): Promise<void>

    changePassword(req: Request, res: Response): Promise<void>
}


export interface ISTutorRepository{
    findAll(): Promise<ITutor[]>
    findById(id: string): Promise<ITutor | null> 
}


export interface ISTutorService{
    getAllTutors(): Promise<ITutor[]> 
    getTutorById(id: string): Promise<{ success: boolean; data: any }>
}


export interface ISTutorController{
    getAllTutors(req: Request, res: Response): Promise<void>
    getTutorById(req: Request, res: Response): Promise<void>
}

export interface IEnrolledStudent {
    student: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    course: {
      _id: string;
      courseTitle: string;
    };
  }
  


export interface IEnrollmentStudRepository{
    getEnrolledStudentsByTutor(tutorId: string): Promise<IEnrolledStudent[]>
}


export interface IEnrollmentStudService{
    getEnrolledStudents(tutorId: string, requestingTutorId: string): Promise<{
        success: boolean;
        message: string;
        enrolledStudents: IEnrolledStudent[];
        total: number;
    }>
}


export interface IEnrollmentStudController{
    getEnrolledStudents(req: Request, res: Response): Promise<void>
}