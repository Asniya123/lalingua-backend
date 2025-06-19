import { Types } from "mongoose";
import { Request, Response } from 'express';

export interface IStudentDisplay {
  _id: string;
  name: string;
  profilePicture?: string;
}

export interface ICourseDisplay {
  _id: string;
  courseTitle: string;
}

export interface IEnrolledStudent {
  student: IStudentDisplay;
  course: ICourseDisplay
  review?: {
    rating: number;
    comment?: string;
  };
  progress: number; 
}

export interface IEnrollment {
  _id?: Types.ObjectId;
  studentId: Types.ObjectId | IStudentDisplay;
  courseId: Types.ObjectId | ICourseDisplay;
  enrolledAt?: Date;
  completedLessons?: Types.ObjectId[] | string[];
  isCourseCompleted?: boolean;
}

export interface StudentDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  profilePicture?: string;
}

export interface CourseDocument extends Document {
  _id: Types.ObjectId;
  courseTitle: string;
}


export interface IEnrollmentRepository{
    getEnrolledStudentsByTutor(tutorId: string): Promise<IEnrolledStudent[]>;
}


export interface IEnrollmentService{
    getEnrolledStudentsByTutor(tutorId: string): Promise<IEnrolledStudent[]>
}


export interface IEnrollmentController{
    getEnrolledStudentsByTutor(req: Request, res: Response): Promise<void>
}