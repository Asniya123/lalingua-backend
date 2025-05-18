import mongoose, { Types} from 'mongoose'; 
import { Request, Response } from "express";
import { ICategory } from './ICategory.js';
import { ILesson } from './ILesson.js';
import { IEnrolledCourse, IEnrollment } from './IStudent.js';
import { ITutor } from './ITutor.js';


export interface ICourse{
  _id?: string;
  courseTitle: string;
  imageUrl: string;
  category: string | Types.ObjectId
  language?: string | Types.ObjectId;
  tutorId: string | Types.ObjectId | ITutorDisplay;
  description: string;
  regularPrice: number;
  buyCount?: number;
  isBlock?: boolean;
  lessons?: ILessonPreview[];
  createdAt?: Date;
  updatedAt?: Date;
  tutor?: ITutorDisplay;
}

export interface ITutorDisplay {
  _id: string;
  name: string;
  profilePicture?: string;
}

export interface ILessonPreview {
  _id: string;
  title: string;
  description: string;
  introVideoUrl?: string;
  videoUrl?: string
}





export interface ICourseRepository {
    addCourse(courseData: ICourse): Promise<ICourse | null>;
    listCourses(tutorId: string,page: number, limit: number): Promise<{ courses: ICourse[]; total: number }>;
    findById(courseId: string): Promise<ICourse | null>
    editCourse(courseId: string, courseData: Partial<ICourse>): Promise<ICourse | null>;
    deleteCourse(courseId: string): Promise<boolean>;
    getCourse(page: number, limit: number): Promise<{ courses: ICourse[]; total: number; }>
    updateBlockStatus(courseId: string, isBlocked: boolean): Promise<ICourse>

   
  }
  
  export interface ICourseService {
    addCourse(courseData: { courseTitle: string; imageUrl: string; category: string; language: string; description: string; regularPrice: number; tutorId: string}): Promise<ICourse | null>;
    listCourses(tutorId: string,page: number, limit: number): Promise<{ courses: ICourse[]; total: number }>;
    getCourse(courseId: string): Promise<ICourse | null>
    editCourse(courseId: string, courseData: Partial<ICourse>): Promise<ICourse | null>;
    deleteCourse(courseId: string): Promise<boolean>;
    

    
  }
  
  export interface ICourseController {
    addCourse(req: Request, res: Response): Promise<void>;
    listCourses(req: Request, res: Response): Promise<void>;
    getCourse(req: Request, res: Response): Promise<void>
    editCourse(req: Request, res: Response): Promise<void>;
    deleteCourse(req: Request, res: Response): Promise<void>;
    
  }


  export interface T {
    total: number;
    category: ICategory[]; 
    courses: ICourse[];
  }
  export interface ISCourseRepository{
    listCourses(page: number, limit: number, search?: string, category?: string, sortBy?: string, language?: string): Promise<{ courses: ICourse[]; total: number }>
    findById(courseId: string): Promise<ICourse | null>
    findByIds(courseIds: mongoose.Types.ObjectId[]): Promise<ICourse[]>
    incrementBuyCount(courseId: string): Promise<ICourse | null>

    findByCourseId(courseId: string): Promise<ILesson[]> 
  }

  export interface ISCourseService{
    getCourse(page: number, limit: number, search?: string, category?: string, sortBy?: string, language?: string): Promise<T>
    getCourseById(courseId: string): Promise<{
      regularPrice: number;course: ICourse,lesson:ILesson[] 
}>
    createOrder(courseId: string, amount: number): Promise<{ orderId: string; amount: number; currency: string }>
    enrollCourse(
      userId: string,
      courseId: string,
      paymentDetails: {
        paymentMethod: 'razorpay';
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
        walletTransactionId?: string;
      } | {
        paymentMethod: 'wallet';
        walletTransactionId: string;
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      }
    ): Promise<void> 
    getEnrolledCourses(userId: string): Promise<IEnrolledCourse[]> 
    listLessons(courseId: string): Promise<{ success: boolean; message: string; lessons: ILesson[] }>
    cancelEnrollment(userId: string, courseId: string): Promise<{ success: boolean; refundAmount: number; message: string }> 
  }

  export interface ISCourseController{
    getCourses(req: Request, res: Response): Promise<void>;  
    getCourseById(req: Request, res: Response): Promise<void>
    createOrder(req: Request, res: Response): Promise<void>
    enrollCourse(req: Request, res: Response): Promise<void>
    getEnrolledCourses(req: Request, res: Response): Promise<void>
    listLessons(req: Request, res: Response): Promise<void> 
    cancelEnrollment(req: Request, res: Response): Promise<void> 
  }






