import { Document, ObjectId } from "mongoose";
import { Request, Response } from "express";
import { ICourse } from "./ICourse.js";
import { IEnrolledStudent, IEnrolledStudentsResponse } from "./IEnrollment.js";
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

interface Query {
  status?: string;
  [key: string]: any; 
}

export interface IAdminRepository {
  findByEmail(email: string | undefined): Promise<IAdmin | null>;
  findCourseEnrolledStudents(courseId: string): Promise<IEnrolledStudent[]>
  getTotalAdminRevenue(): Promise<number>
}

export interface IAdminService {
  login(email: string, password: string): Promise<ILogin>;

  getUsers(page: number, limit: number, search?: string): Promise<{ users: IAdmin[], total: number, totalStudents: number }>  
  blockUnblock(userId: string, isBlocked: boolean): Promise<any>

 getTutors(
  page: number,
  limit: number,
  query: any,
  search?: string
): Promise<{ tutor: IAdmin[]; total: number; totalApprovedTutors: number }>;

  tutorManagement(tutorId: string, isBlocked: boolean): Promise<any>
  getAllTutors(search?: string): Promise<IAdmin[]> 
  updateTutorStatus(tutorId: string, status: 'approved' | 'rejected', reason?: string): Promise<{ success: boolean; message: string }>

  getCourse(page: number, limit: number, search?: string): Promise<{ courses: ICourse[]; total: number }>
  blockedUnblocked(courseId: string, isBlocked: boolean): Promise<any>
  listCourseEnrolledStudents(courseId: string): Promise<IEnrolledStudentsResponse>
  getTotalAdminRevenue(): Promise<number>
}

export interface IAdminController {
  login(req: Request, res: Response): Promise<void>;

  getUsers(req: Request, res: Response): Promise<void>;  

  blockUnblock(req: Request, res: Response): Promise<void>

  getTutors(req: Request, res: Response): Promise<void>;  
  tutorManagement(req: Request, res: Response): Promise<void>
  getAllTutors(req: Request, res: Response): Promise<void>
  updateTutorStatus(req: Request, res: Response): Promise<void>

  getCourse(req: Request, res: Response): Promise<void>
  blockedUnblocked(req: Request, res: Response): Promise<void>
 
  listCourseEnrolledStudents(req: Request, res: Response): Promise<void>
  getTotalAdminRevenue(req: Request, res: Response): Promise<void>
}
