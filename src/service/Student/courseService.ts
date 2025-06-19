import mongoose, { isValidObjectId, Types } from "mongoose";
import { ICategoryRepository } from "../../interface/ICategory.js";
import {
  CourseCompletionResult,
  ICourse,
  ISCourseRepository,
  ISCourseService,
  T,
} from "../../interface/ICourse.js";
import {
  IEnrolledCourse,
  IEnrollment,
  IStudentRepository,
} from "../../interface/IStudent.js";
import categoryRepository from "../../repositories/admin/categoryRepository.js";
import courseRepository from "../../repositories/student/courseRepository.js";
import studentRepo from "../../repositories/student/studentRepo.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import { ILesson, ILessonRepository } from "../../interface/ILesson.js";
import lessonRepository from "../../repositories/tutor/lessonRepository.js";
import { IWalletRepository } from "../../interface/IWallet.js";
import walletRepository from "../../repositories/student/walletRepository.js";
import { IReviewRepository } from "../../interface/IReview.js";
import reviewRepository from "../../repositories/student/reviewRepository.js";

dotenv.config();

export class CourseService implements ISCourseService {
  private courseRepository: ISCourseRepository;
  private categoryRepository: ICategoryRepository;
  private studentRepository: IStudentRepository;
  private lessonRepository: ILessonRepository;
  private walletRepository: IWalletRepository;
  private reviewRepository: IReviewRepository;
  private razorpay: Razorpay;

  constructor(
    courseRepository: ISCourseRepository,
    categoryRepository: ICategoryRepository,
    studentRepository: IStudentRepository,
    lessonRepository: ILessonRepository,
    walletRepository: IWalletRepository,
    reviewRepository: IReviewRepository
  ) {
    this.courseRepository = courseRepository;
    this.categoryRepository = categoryRepository;
    this.studentRepository = studentRepository;
    this.lessonRepository = lessonRepository;
    this.walletRepository = walletRepository;
    this.reviewRepository = reviewRepository;

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

  async enrollCourse(
    userId: string,
    courseId: string,
    paymentDetails:
      | {
          paymentMethod: "razorpay";
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
          walletTransactionId?: string;
        }
      | {
          paymentMethod: "wallet";
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
        paymentId:
          paymentDetails.paymentMethod === "razorpay"
            ? paymentDetails.razorpay_payment_id!
            : paymentDetails.walletTransactionId || `wallet_${Date.now()}`,
        orderId:
          paymentDetails.paymentMethod === "razorpay"
            ? paymentDetails.razorpay_order_id!
            : `wallet_order_${Date.now()}`,
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

    const enrolledCourses: IEnrolledCourse[] = await Promise.all(
      courses.map(async (course) => {
        const enrollment = student.enrollments?.find(
          (enrollment) =>
            enrollment.courseId.toString() === course._id!.toString()
        );

        const review = await this.reviewRepository.findByUserAndCourse(
          userId,
          course._id!.toString()
        );

        const lessons = course.lessons || [];
        const totalLessons = lessons.length;

        const completedLessonsData = await this.courseRepository.findCompletionsByUserAndCourse(
          userId,
          course._id!.toString()
        );
        const completedLessons = completedLessonsData.length;

        // Calculate completion status based on completed lessons
        const isCompleted = totalLessons > 0 ? completedLessons === totalLessons : false;
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          _id: course._id!,
          courseTitle: course.courseTitle || "Untitled Course",
          description: course.description,
          imageUrl: course.imageUrl,
          pricePaid: enrollment?.amount || 0,
          enrolledAt: enrollment?.enrolledAt?.toString() || new Date().toString(),
          enrolledDate: enrollment?.enrolledAt?.toString() || new Date().toString(),
          status: enrollment?.status || "Active",
          tutor: course.tutor,
          review: review || undefined,
          completedLessons: completedLessons,
          totalLessons: totalLessons,
          isCompleted: isCompleted,
          completedAt: enrollment?.completedAt || undefined,
          progress: progress,
        };
      })
    );

    return enrolledCourses;
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    throw new Error("Failed to retrieve enrolled courses");
  }
}

  async cancelEnrollment(userId: string, courseId: string): Promise<{ success: boolean; refundAmount: number; message: string }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
        console.error(`Invalid ObjectId: userId=${userId}, courseId=${courseId}`);
        throw new Error('Invalid user or course ID');
      }

      const student = await this.studentRepository.findById(userId);
      if (!student) {
        console.error(`Student not found for userId: ${userId}`);
        throw new Error('Student not found');
      }

      if (!student.enrollments || student.enrollments.length === 0) {
        console.error(`No enrollments found for student: ${userId}`);
        throw new Error('No enrollments found for this student');
      }

      const enrollment = student.enrollments.find(e => e.courseId.toString() === courseId);
      if (!enrollment) {
        console.error(`Enrollment not found for courseId: ${courseId}`);
        throw new Error('Enrollment not found for this course');
      }

      if (enrollment.isCompleted) {
        console.error(`Course is completed for courseId: ${courseId}`);
        throw new Error('Cannot cancel a completed course');
      }

      const enrolledAt = new Date(enrollment.enrolledAt);
      if (isNaN(enrolledAt.getTime())) {
        console.error(`Invalid enrolledAt date for enrollment: ${courseId}`);
        throw new Error('Invalid enrollment date');
      }

      const now = new Date();
      const daysSinceEnrollment = (now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrollment > 7) {
        console.error(`Refund period expired for enrollment: ${courseId}`);
        throw new Error('Refund period has expired (7 days)');
      }

      const refundAmount = enrollment.amount || 0;
      if (refundAmount <= 0) {
        console.error(`Invalid refund amount for enrollment: ${courseId}`);
        throw new Error('No payment amount found for this enrollment');
      }

      const reason = `Refund for canceling course ${courseId}`;
      const transactionId = enrollment.paymentId || courseId;

      const wallet = await this.walletRepository.refundWallet(transactionId, userId, refundAmount, reason);
      if (!wallet) {
        console.error(`Wallet refund failed for userId: ${userId}`);
        throw new Error('Failed to process refund to wallet');
      }

      const updatedStudent = await this.studentRepository.update(userId, {
        $pull: { enrollments: { courseId: new Types.ObjectId(courseId) } },
      });
      if (!updatedStudent) {
        console.error(`Failed to update student enrollments for userId: ${userId}`);
        throw new Error('Failed to update enrollment status');
      }

      console.log(`Course canceled successfully for userId: ${userId}, courseId: ${courseId}, refundAmount: ${refundAmount}`);
      return {
        success: true,
        refundAmount,
        message: `Course canceled successfully. ₹${refundAmount} refunded to your wallet.`,
      };
    } catch (error: any) {
      console.error('Service: Error in cancelEnrollment:', {
        message: error.message,
        userId,
        courseId,
        stack: error.stack,
      });
      throw new Error(`Failed to cancel enrollment: ${error.message}`);
    }
  }

  async listLessons(
    courseId: string
  ): Promise<{ success: boolean; message: string; lessons: ILesson[] }> {
    try {
      const lessons = await this.courseRepository.findByCourseId(courseId);
      return {
        success: true,
        message: "Lesson retrieved successfully",
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

  async completeLesson(userId: string, courseId: string, lessonId: string): Promise<{ success: boolean; message?: string }> {
  try {
   
    const existingCompletion = await this.courseRepository.findCompletionsByUserAndCourse(userId, courseId);
    if (existingCompletion.some(completion => completion.lessonId.toString() === lessonId)) {
      return { success: false, message: 'Lesson already completed' };
    }

    
    await this.courseRepository.createCompletion(userId, courseId, lessonId);

  
    const completedLessons = await this.getCompletedLessons(userId, courseId);
    console.log(`Completed lessons count after marking lesson ${lessonId}: ${completedLessons.length}`);

    
    await this.courseRepository.updateEnrollmentCompletedLessons(userId, courseId, completedLessons.length);
    console.log(`Updated enrollment for user ${userId}, course ${courseId} with ${completedLessons.length} completed lessons`);

    const totalLessons = await this.courseRepository.getTotalLessonsCount(courseId);
    console.log(`Total lessons for course ${courseId}: ${totalLessons}`);
    if (totalLessons > 0 && completedLessons.length === totalLessons) {
      await this.courseRepository.markCourseCompleted(userId, courseId, new Date());
      console.log(`Course ${courseId} marked as completed for user ${userId}`);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Failed to complete lesson: ${errorMessage}`);
    throw new Error(`Failed to complete lesson: ${errorMessage}`);
  }
}

  async getCompletedLessons(userId: string, courseId: string): Promise<string[]> {
    try {
      const completions = await this.courseRepository.findCompletionsByUserAndCourse(userId, courseId);
      return completions.map(completion => completion.lessonId.toString());
    } catch (error: any) {
      throw new Error(`Failed to fetch completed lessons: ${error.message || 'Unknown error'}`);
    }
  }

 async markCourseCompleted(userId: string, courseId: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Marking course as completed: userId=${userId}, courseId=${courseId}`);
    const course = await this.courseRepository.findByCourseId(courseId);
    if (!course) {
      console.log(`Course not found: ${courseId}`);
      return { success: false, message: "Course not found" };
    }

    const totalLessons = await this.courseRepository.getTotalLessonsCount(courseId);
    console.log(`Total lessons for course ${courseId}: ${totalLessons}`);

    // Prevent marking courses with 0 lessons as completed automatically
    if (totalLessons === 0) {
      console.log(`Course ${courseId} has no lessons; cannot mark as completed`);
      return { success: false, message: "Cannot mark a course with no lessons as completed" };
    }

    const completedLessons = await this.getCompletedLessons(userId, courseId);
    console.log(`Completed lessons: ${completedLessons.length}, Total lessons: ${totalLessons}`);
    if (completedLessons.length !== totalLessons) {
      return { success: false, message: "Not all lessons are completed" };
    }

    await this.courseRepository.markCourseCompleted(userId, courseId, new Date());
    console.log(`Course ${courseId} marked as completed for user ${userId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Failed to mark course as completed: ${errorMessage}`);
    throw new Error(`Failed to mark course as completed: ${errorMessage}`);
  }
}
}


export default new CourseService(
  courseRepository,
  categoryRepository,
  studentRepo,
  lessonRepository,
  walletRepository,
  reviewRepository
);
