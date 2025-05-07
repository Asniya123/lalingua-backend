import { Schema } from "mongoose";
import { ICourse } from "./ICourse.js";

export interface IEnrollment {
    userId: string;
    courseId: Schema.Types.ObjectId | ICourse;
    enrolledAt: Date;
    progress?: number;
    paymentId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    status?: string;
}


export interface IEnrollmentRepository{
    getEnrolledCoursesByUserId(userId: string): Promise<IEnrollment[]>
}


export interface IEnrollmentService{
    getUserEnrolledCourses(userId: string): Promise<{ success: boolean; data: IEnrollment[] }>
}


export interface IEnrollmentController{
    getUserEnrolledCourses(req: Request, res: Response): Promise<void>
}