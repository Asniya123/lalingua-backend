import { Request, Response } from "express";
import { ObjectId } from "mongodb"; 
import { ISCourseController, ISCourseService,ICourse, ITutorDisplay } from "../../interface/ICourse.js";
import { CustomError } from "../../domain/errors/customError.js";
import HttpStatusCode from "../../domain/enum/httpstatus.js";
import { IWalletService } from "../../interface/IWallet.js";
import walletService from "../../service/Student/walletService.js";
import { ILesson } from "../../interface/ILesson.js";

interface PaymentDetails {
  paymentMethod: "razorpay" | "wallet";
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  walletTransactionId?: string;
}

export default class CourseController implements ISCourseController {
  private courseService: ISCourseService;
  private walletService: IWalletService;

  constructor(courseService: ISCourseService) {
    this.courseService = courseService;
    this.walletService = walletService
  }
   

  async getCourses(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const language = req.query.language as string | undefined;

    

      const result = await this.courseService.getCourse(page, limit, search, category, sortBy, language);
      res.status(200).json({
        success: true,
        courses: result.courses,
        category: result.category,
        total: result.total,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error fetching courses",
      });
    }
  }


  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
  
      if (!courseId) {
        res.status(400).json({ success: false, error: "Course ID is required" });
        return;
      }
  
      const { course, lesson } = await this.courseService.getCourseById(courseId);
  
      if (!course) {
        res.status(404).json({ success: false, error: "Course not found" });
        return;
      }
  
      const sanitizedCourse: ICourse = {
        _id: course._id?.toString() || new ObjectId().toString(),
        courseTitle: course.courseTitle || "Untitled Course",
        description: course.description || "No description available",
        regularPrice: course.regularPrice || 0,
        buyCount: course.buyCount || 0,
        imageUrl: course.imageUrl || "",
        category: course.category && typeof course.category === 'object' && 'name' in course.category
          ? course.category
          : course.category?.toString() || "Uncategorized",
        language: course.language && typeof course.language === 'object' && 'name' in course.language
          ? course.language
          : course.language?.toString() || "Unknown",
        isBlock: course.isBlock || false,
        lessons: lesson?.map((lesson: ILesson) => ({
          _id: lesson._id?.toString() || '',
          title: lesson.title || "Untitled Lesson",
          description: lesson.description || "No description",
          introVideoUrl: lesson.introVideoUrl || "",
          videoUrl: lesson.videoUrl || "",
        })) || [],
        tutorId: course.tutorId && typeof course.tutorId === 'object' && 'name' in course.tutorId
          ? course.tutorId
          : course.tutorId?.toString() || '',
        tutor: course.tutor && typeof course.tutor === 'object' && 'name' in course.tutor
          ? {
              _id: course.tutor._id.toString(),
              name: course.tutor.name || "Unknown Tutor",
              profilePicture: course.tutor.profilePicture || undefined,
            }
          : course.tutorId && typeof course.tutorId === 'object' && 'name' in course.tutorId && typeof (course.tutorId as ITutorDisplay).name === 'string'
          ? {
              _id: (course.tutorId as ITutorDisplay)._id.toString(),
              name: (course.tutorId as ITutorDisplay).name || "Unknown Tutor",
              profilePicture: (course.tutorId as ITutorDisplay).profilePicture || undefined,
            }
          : undefined,
      };
  

      res.status(200).json({ success: true, course: sanitizedCourse });
    } catch (error) {
      console.error("Error in getCourseById:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }


  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, amount } = req.body;

      if (!courseId || !amount) {
        res.status(400).json({ success: false, message: "Course ID and amount are required" });
        return;
      }

      const orderResponse = await this.courseService.createOrder(courseId, amount);
      res.status(200).json({
        success: true,
        orderId: orderResponse.orderId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
      });
    } catch (error) {
      console.error("Controller error creating order:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create order",
      });
    }
  }

  async enrollCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, paymentId, orderId, signature, paymentMethod } = req.body;
      const userId = req.user?._id;
  
      if (!userId || !courseId || !paymentMethod) {
        throw new CustomError(
          "User ID, course ID, and payment method are required",
          HttpStatusCode.BAD_REQUEST
        );
      }
  
      let paymentDetails:
        | {
            paymentMethod: "razorpay";
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }
        | {
            paymentMethod: "wallet";
            walletTransactionId: string;
          };
  
      if (paymentMethod === "razorpay") {
        if (!paymentId || !orderId || !signature) {
          throw new CustomError(
            "Razorpay payment details are required",
            HttpStatusCode.BAD_REQUEST
          );
        }
  
        paymentDetails = {
          paymentMethod: "razorpay",
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          razorpay_signature: signature,
        };
      } else if (paymentMethod === "wallet") {
        const course = await this.courseService.getCourseById(courseId);
        if (!course || typeof course?.regularPrice !== "number") {
          throw new CustomError("Course not found", HttpStatusCode.NOT_FOUND);
        }
  
        const walletResponse = await this.walletService.wallet_payment({
          userId,
          amount: course.regularPrice,
        });
  
        if (!walletResponse.success || !walletResponse.wallet) {
          throw new CustomError(
            walletResponse.message || "Insufficient wallet balance",
            HttpStatusCode.BAD_REQUEST
          );
        }
  
        const walletTransactionId = `wallet_tx_${Date.now()}`;
        await this.walletService.debitWallet(
          walletTransactionId,
          userId,
          course.regularPrice,
          `Payment for course ${courseId}`
        );
  
        paymentDetails = {
          paymentMethod: "wallet",
          walletTransactionId,
        };
      } else {
        throw new CustomError(
          "Invalid payment method",
          HttpStatusCode.BAD_REQUEST
        );
      }
  
      
      await this.courseService.enrollCourse(userId, courseId, paymentDetails);
  
      res.status(200).json({ success: true, message: "Enrollment successful" });
    } catch (error) {
      console.error("Controller error enrolling course:", error);
      const status =
        error instanceof CustomError
          ? error.statusCode
          : HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(status).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to enroll course",
      });
    }
  }
  

  async getEnrolledCourses(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    try {
      const courses = await this.courseService.getEnrolledCourses(userId);
      res.status(200).json({ success: true, courses });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Error fetching enrolled courses" });
    }
  }

  async cancelEnrollment(req: Request, res: Response): Promise<void> {
    const { userId, courseId } = req.params;
    try {
      const result = await this.courseService.cancelEnrollment(userId, courseId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error canceling enrollment",
      });
    }
  }

  async listLessons(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      if (!courseId) {
        res.status(400).json({ success: false, message: 'Course ID is required' });
        return;
      }
  
      const result = await this.courseService.listLessons(courseId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'Unknown error occurred' });
      }
    }
  }
  

}