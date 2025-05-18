import mongoose, { isValidObjectId } from "mongoose";
import { ICategoryRepository } from "../../interface/ICategory.js";
import {ICourse,ISCourseRepository,ISCourseService,T,} from "../../interface/ICourse.js";
import { IEnrolledCourse, IEnrollment, IStudentRepository } from "../../interface/IStudent.js";
import categoryRepository from "../../repositories/admin/categoryRepository.js";
import courseRepository from "../../repositories/student/courseRepository.js";
import studentRepo from "../../repositories/student/studentRepo.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import { ILesson, ILessonRepository } from "../../interface/ILesson.js";
import lessonRepository from "../../repositories/tutor/lessonRepository.js";
import { CustomError } from "../../domain/errors/customError.js";
import HttpStatusCode from "../../domain/enum/httpstatus.js";
import { IWalletRepository } from "../../interface/IWallet.js";
import walletRepository from "../../repositories/student/walletRepository.js";

dotenv.config();

export class CourseService implements ISCourseService {
  private courseRepository: ISCourseRepository;
  private categoryRepository: ICategoryRepository;
  private studentRepository: IStudentRepository;
  private lessonRepository: ILessonRepository;
  private walletRepository: IWalletRepository
  private razorpay: Razorpay;

  constructor(
    courseRepository: ISCourseRepository,
    categoryRepository: ICategoryRepository,
    studentRepository: IStudentRepository,
    lessonRepository: ILessonRepository,
    walletRepository: IWalletRepository
  ) {
    this.courseRepository = courseRepository;
    this.categoryRepository = categoryRepository;
    this.studentRepository = studentRepository;
    this.lessonRepository = lessonRepository;
    this.walletRepository = walletRepository

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay keys are missing:", { keyId, keySecret });
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in .env"
      );
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async getCourse(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    sortBy?: string,
    language?: string
  ): Promise<T> {
    try {
      const { courses, total } = await this.courseRepository.listCourses(
        page,
        limit,
        search,
        category,
        sortBy,
        language
      );
      const categories = await this.categoryRepository.listAllCategories();
      const result = {
        courses,
        category: Array.isArray(categories) ? categories : [],
        total,
      };

      return result;
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error;
    }
  }

  async getCourseById(
    courseId: string
  ): Promise<{ regularPrice: number; course: ICourse; lesson: ILesson[] }> {
    try {
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }
  
      const lesson = await this.lessonRepository.courseLesson(courseId);
      const regularPrice = course.regularPrice; 
  
      return { regularPrice, course, lesson };
    } catch (error) {
      console.error("Error fetching course ID", error);
      throw error;
    }
  }
  

  async createOrder(
    courseId: string,
    amount: number
  ): Promise<{ orderId: string; amount: number; currency: string }> {
    try {
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      if (amount !== course.regularPrice * 100) {
        throw new Error("Amount does not match course price");
      }

      const shortCourseId = course._id?.toString().slice(0, 10);
      const shortTimestamp = Date.now().toString().slice(-6);
      const receipt = `r_${shortCourseId}_${shortTimestamp}`;

      if (receipt.length > 40) {
        throw new Error("Generated receipt exceeds 40 characters");
      }

      const options = {
        amount: course.regularPrice * 100,
        currency: "INR",
        receipt: receipt,
      };

      const order = await this.razorpay.orders.create(options);
      return {
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    } catch (error) {
      console.error("Error creating Razorpay order:", error);

      if (error instanceof Error && "error" in error) {
        const razorpayError = (error as any).error;
        throw new Error(
          `Failed to create Razorpay order: ${
            razorpayError.description || "Unknown error"
          }`
        );
      }
      throw new Error(
        `Failed to create Razorpay order: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async  enrollCourse(
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
  ): Promise<void> {
   
    try {
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }
  
      const enrollmentData: IEnrollment = {
        courseId: new mongoose.Types.ObjectId(courseId),
        paymentId: paymentDetails.paymentMethod === 'razorpay' ? paymentDetails.razorpay_payment_id! : paymentDetails.walletTransactionId || `wallet_${Date.now()}`,
        orderId: paymentDetails.paymentMethod === 'razorpay' ? paymentDetails.razorpay_order_id! : `wallet_order_${Date.now()}`,
        amount: course.regularPrice, 
        currency: "INR",
        status: "completed",
        enrolledAt: new Date(),
        paymentAmount: course.regularPrice,
      };
  
      const updatedStudent = await this.studentRepository.updateEnrollments(
        userId,
        enrollmentData
      );
      if (!updatedStudent) {
        throw new Error("Student not found");
      }
  
      await this.courseRepository.incrementBuyCount(courseId);
    } catch (error) {
      console.error("Service error enrolling course:", error);
      throw new Error(
        `Failed to enroll course: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getEnrolledCourses(userId: string): Promise<IEnrolledCourse[]> {
    try {
    const student = await this.studentRepository.findById(userId);
    if (!student) return [];
  
    const courseIds = student.enrollments
      ? student.enrollments.map((enrollment) => enrollment.courseId)
      : [];
    const courses = await this.courseRepository.findByIds(courseIds);
  
    const enrolledCourses: IEnrolledCourse[] = courses.map((course) => {
      const enrollment = student.enrollments?.find(
        (enrollment) => enrollment.courseId.toString() === course._id!.toString() 
      );
    
      return {
        _id: course._id!, 
        courseTitle: course.courseTitle || "Untitled Course",
        imageUrl: course.imageUrl,
        category: course.category,
        language: course.language,
        tutorId: course.tutorId,
        description: course.description,
        regularPrice: course.regularPrice,
        buyCount: course.buyCount,
        isBlock: course.isBlock,
        lessons: course.lessons,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        tutor: course.tutor,
        pricePaid: enrollment?.amount || 0,
        enrolledDate: enrollment?.enrolledAt?.toISOString() || undefined,
        status: enrollment?.status || "Unknown",
      };
    });
  
    return enrolledCourses;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    throw new Error('Failed to retrieve enrolled courses');
  }
  }

  async cancelEnrollment(userId: string, courseId: string): Promise<{ success: boolean; refundAmount: number; message: string }> {

  
    if (!isValidObjectId(userId) || !isValidObjectId(courseId)) {
      console.error(`Invalid ObjectId: userId=${userId}, courseId=${courseId}`);
      throw new CustomError("Invalid user or course ID", HttpStatusCode.BAD_REQUEST);
    }
  
    const student = await this.studentRepository.findById(userId);
    if (!student) {
      console.error(`Student not found for userId: ${userId}`);
      throw new CustomError("Student not found", HttpStatusCode.NOT_FOUND);
    }
  
  
    if (!student.enrollments || student.enrollments.length === 0) {
      console.error(`No enrollments found for student: ${userId}`);
      throw new CustomError("No enrollments found for this student", HttpStatusCode.NOT_FOUND);
    }
  
    const enrollment = student.enrollments.find((e) => e.courseId.toString() === courseId);
    if (!enrollment) {
      console.error(`Enrollment not found for courseId: ${courseId}`);
      throw new CustomError("Enrollment not found for this course", HttpStatusCode.NOT_FOUND);
    }
    
  
    const enrolledAt = new Date(enrollment.enrolledAt);
    if (isNaN(enrolledAt.getTime())) {
      console.error(`Invalid enrolledAt date for enrollment: ${courseId}`);
      throw new CustomError("Invalid enrollment date", HttpStatusCode.BAD_REQUEST);
    }
  
    const now = new Date();
    const daysSinceEnrollment = (now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceEnrollment > 7) {
      console.error(`Refund period expired for enrollment: ${courseId}`);
      throw new CustomError("Refund period has expired (7 days)", HttpStatusCode.BAD_REQUEST);
    }
  
    const refundAmount = enrollment.amount || 0;

    if (refundAmount <= 0) {
      console.error(`Invalid refund amount for enrollment: ${courseId}`);
      throw new CustomError("No payment amount found for this enrollment", HttpStatusCode.BAD_REQUEST);
    }
  
    const reason = `Refund for canceling course ${courseId}`;
   
    const wallet = await this.walletRepository.refundWallet(enrollment.paymentId, userId, refundAmount, reason);
    if (!wallet) {
      console.error(`Wallet refund failed for userId: ${userId}`);
      throw new CustomError("Failed to process refund to wallet", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    const updatedStudent = await this.studentRepository.update(userId, {
      $pull: { enrollments: { courseId } },
    });
    if (!updatedStudent) {
      console.error(`Failed to update student enrollments for userId: ${userId}`);
      throw new CustomError("Failed to update enrollment status", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  
    
    return {
      success: true,
      refundAmount,
      message: `Course canceled successfully. ₹${refundAmount} refunded to your wallet.`,
    };
  }


  async listLessons(courseId: string): Promise<{ success: boolean; message: string; lessons: ILesson[] }> {
    try {
      const lessons = await this.courseRepository.findByCourseId(courseId);
      return {
        success: true,
        message: 'Lesson retrieved successfully',
        lessons,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list lessons: ${error.message}`);
      } else {
        throw new Error("Failed to list lessons: Unknown error occurred");
      }
    }
  }
  
}

export default new CourseService(
  courseRepository,
  categoryRepository,
  studentRepo,
  lessonRepository,
  walletRepository
);
