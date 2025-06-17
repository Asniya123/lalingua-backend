import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  ISCourseController,
  ISCourseService,
  ICourse,
  ITutorDisplay,
} from "../../interface/ICourse.js";
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
    this.walletService = walletService;
  }

  async getCourses(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const language = req.query.language as string | undefined;

      const result = await this.courseService.getCourse(
        page,
        limit,
        search,
        category,
        sortBy,
        language
      );
      res.status(200).json({
        success: true,
        courses: result.courses,
        category: result.category,
        total: result.total,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error fetching courses",
      });
    }
  }

  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        res
          .status(400)
          .json({ success: false, error: "Course ID is required" });
        return;
      }

      const { course, lesson } = await this.courseService.getCourseById(
        courseId
      );

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
        category:
          course.category &&
          typeof course.category === "object" &&
          "name" in course.category
            ? course.category
            : course.category?.toString() || "Uncategorized",
        language:
          course.language &&
          typeof course.language === "object" &&
          "name" in course.language
            ? course.language
            : course.language?.toString() || "Unknown",
        isBlock: course.isBlock || false,
        lessons:
          lesson?.map((lesson: ILesson) => ({
            _id: lesson._id?.toString() || "",
            title: lesson.title || "Untitled Lesson",
            description: lesson.description || "No description",
            introVideoUrl: lesson.introVideoUrl || "",
            videoUrl: lesson.videoUrl || "",
            syllabus: lesson.syllabus
              ? {
                  title: lesson.syllabus.title || "Untitled Syllabus",
                  description: lesson.syllabus.description || undefined,
                }
              : undefined,
          })) || [],
        tutorId:
          course.tutorId &&
          typeof course.tutorId === "object" &&
          "name" in course.tutorId
            ? course.tutorId
            : course.tutorId?.toString() || "",
        tutor:
          course.tutor &&
          typeof course.tutor === "object" &&
          "name" in course.tutor
            ? {
                _id: course.tutor._id.toString(),
                name: course.tutor.name || "Unknown Tutor",
                profilePicture: course.tutor.profilePicture || undefined,
              }
            : course.tutorId &&
              typeof course.tutorId === "object" &&
              "name" in course.tutorId &&
              typeof (course.tutorId as ITutorDisplay).name === "string"
            ? {
                _id: (course.tutorId as ITutorDisplay)._id.toString(),
                name: (course.tutorId as ITutorDisplay).name || "Unknown Tutor",
                profilePicture:
                  (course.tutorId as ITutorDisplay).profilePicture || undefined,
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
        res
          .status(400)
          .json({
            success: false,
            message: "Course ID and amount are required",
          });
        return;
      }

      const orderResponse = await this.courseService.createOrder(
        courseId,
        amount
      );
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
        message:
          error instanceof Error ? error.message : "Failed to create order",
      });
    }
  }

  async enrollCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, paymentId, orderId, signature, paymentMethod } =
        req.body;
      const userId = req.user?._id;

      if (!userId || !courseId || !paymentMethod) {
        throw new Error("User ID, course ID, and payment method are required");
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
          throw new Error("Razorpay payment details are required");
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
          throw new Error("Course not found");
        }

        const walletResponse = await this.walletService.wallet_payment({
          userId,
          amount: course.regularPrice,
        });

        if (!walletResponse.success || !walletResponse.wallet) {
          throw new Error(
            walletResponse.message || "Insufficient wallet balance"
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
        throw new Error("Invalid payment method");
      }

      await this.courseService.enrollCourse(userId, courseId, paymentDetails);

      res.status(200).json({ success: true, message: "Enrollment successful" });
    } catch (error) {
      console.error("Controller: Error enrolling course:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const statusCode =
        error instanceof Error
          ? error.message.includes("Invalid") ||
            error.message.includes("required")
            ? 400
            : error.message.includes("not found")
            ? 404
            : error.message.includes("Insufficient")
            ? 400
            : 500
          : 500;

      res.status(statusCode).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to enroll course",
      });
    }
  }

  async getEnrolledCourses(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const courses = await this.courseService.getEnrolledCourses(userId);
      res
        .status(200)
        .json({
          success: true,
          message: "Enrolled courses retrieved successfully",
          courses,
        });
    } catch (error) {
      console.error("Error in getEnrolledCourses:", error);
      res
        .status(500)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Error fetching enrolled courses",
        });
    }
  }

  async cancelEnrollment(req: Request, res: Response): Promise<void> {
    const { userId, courseId } = req.params;
    try {
      const result = await this.courseService.cancelEnrollment(
        userId,
        courseId
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Error canceling enrollment",
      });
    }
  }

  async listLessons(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      if (!courseId) {
        res
          .status(400)
          .json({ success: false, message: "Course ID is required" });
        return;
      }

      const result = await this.courseService.listLessons(courseId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Unknown error occurred" });
      }
    }
  }

 async completeLesson(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, lessonId } = req.body;

      if (!req.user || !req.user._id) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      // Validate input
      if (!courseId || !lessonId) {
        res.status(400).json({ success: false, message: "Course ID and Lesson ID are required" });
        return;
      }

      const userId = req.user._id;
      const result = await this.courseService.completeLesson(userId, courseId, lessonId);

      if (result.success) {
        res.status(200).json({ success: true, message: "Lesson marked as completed" });
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error('Error in completeLesson controller:', errorMessage);
      res.status(500).json({ success: false, message: errorMessage });
    }
  }

  async getCompletedLessons(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      
      if (!req.user || !req.user._id) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      if (!courseId) {
        res.status(400).json({ success: false, message: "Course ID is required" });
        return;
      }

      const userId = req.user._id;
      const completedLessons = await this.courseService.getCompletedLessons(userId, courseId);
      
      res.status(200).json({ 
        success: true, 
        completedLessons,
        count: completedLessons.length 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error('Error in getCompletedLessons controller:', errorMessage);
      res.status(500).json({ success: false, message: errorMessage });
    }
  }

  async markCourseCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      
      if (!req.user || !req.user._id) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      if (!courseId) {
        res.status(400).json({ success: false, message: "Course ID is required" });
        return;
      }

      const userId = req.user._id;
      const result = await this.courseService.markCourseCompleted(userId, courseId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message || "Course marked as completed",
          isCompleted: result.isCompleted
        });
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error('Error in markCourseCompleted controller:', errorMessage);
      res.status(500).json({ success: false, message: errorMessage });
    }
  }
}
