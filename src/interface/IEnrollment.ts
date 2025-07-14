import { Types } from "mongoose";
import { Request, Response } from 'express';
import { IReview } from "./IReview.js";




export interface IEnrollment {
  name: string
  courseId : Types.ObjectId | string
  tutorId : Types.ObjectId | string
  enrolledDate : Date | string
  progress: number
}

export interface IEnrolledStudent {
  id: string;
  name: string;
  courseId?: string;
  enrolledDate: string;
  progress: number;
  review?: IReview;
  totalRevenue: number;

}

export interface IEnrolledStudentsResponse {
  success: boolean;
  message: string;
  students: IEnrolledStudent[];
}


export interface ICourseWithEnrollments {
  _id: string;
  courseTitle: string;
  description?: string;
  regularPrice: number;
  imageUrl?: string;
  enrolledStudents: IEnrolledStudent[];
  reviews: IReview[];
  studentsWithReviews?: number;
  
}


export interface IEnrollmentRepository {
  findEnrolledStudents(tutorId: string, courseId?: string): Promise<IEnrolledStudent[]>
}


export interface IEnrollmentService {
  listEnrolledStudents(tutorId: string, courseId?: string): Promise<IEnrolledStudentsResponse>
}

export interface IEnrollmentController {
  listEnrolledStudents(req: Request, res: Response): Promise<void>
}


export interface IDailyEnrollment {
  day: string;
  count: number;
}

export interface IMonthlyEnrollment {
  month: string;
  count: number;
}

export interface IYearlyEnrollment {
  year: number;
  count: number;
}

export interface IEnrollmentStats {
  daily: IDailyEnrollment[];
  monthly: IMonthlyEnrollment[];
  yearly: IYearlyEnrollment[];
}

export interface IEnrollmentChartRepository {
  getDailyEnrollmentData(): Promise<IDailyEnrollment[]>;
  getMonthlyEnrollmentData(): Promise<IMonthlyEnrollment[]>;
  getYearlyEnrollmentData(): Promise<IYearlyEnrollment[]>;
  getEnrollmentStats(): Promise<IEnrollmentStats>;
}

export interface IEnrollmentChartService{
   fetchEnrollmentStats(): Promise<IEnrollmentStats>
}

export interface IEnrollmentChartController{
  getEnrollmentStats(req: Request, res: Response): Promise<void>
}