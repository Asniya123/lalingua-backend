var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from "mongoose";
import categoryRepository from "../../repositories/admin/categoryRepository.js";
import courseRepository from "../../repositories/student/courseRepository.js";
import studentRepo from "../../repositories/student/studentRepo.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import lessonRepository from "../../repositories/tutor/lessonRepository.js";
import walletRepository from "../../repositories/student/walletRepository.js";
import reviewRepository from "../../repositories/student/reviewRepository.js";
dotenv.config();
export class CourseService {
    constructor(courseRepository, categoryRepository, studentRepository, lessonRepository, walletRepository, reviewRepository) {
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
            throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in .env");
        }
        this.razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    getCourse(page, limit, search, category, sortBy, language) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { courses, total } = yield this.courseRepository.listCourses(page, limit, search, category, sortBy, language);
                const categories = yield this.categoryRepository.listAllCategories();
                const result = {
                    courses,
                    category: Array.isArray(categories) ? categories : [],
                    total,
                };
                return result;
            }
            catch (error) {
                console.error("Error fetching courses:", error);
                throw error;
            }
        });
    }
    getCourseById(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const course = yield this.courseRepository.findById(courseId);
                if (!course) {
                    throw new Error("Course not found");
                }
                const lesson = yield this.lessonRepository.courseLesson(courseId);
                const regularPrice = course.regularPrice;
                return { regularPrice, course, lesson };
            }
            catch (error) {
                console.error("Error fetching course ID", error);
                throw error;
            }
        });
    }
    createOrder(courseId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const course = yield this.courseRepository.findById(courseId);
                if (!course) {
                    throw new Error("Course not found");
                }
                if (amount !== course.regularPrice * 100) {
                    throw new Error("Amount does not match course price");
                }
                const shortCourseId = (_a = course._id) === null || _a === void 0 ? void 0 : _a.toString().slice(0, 10);
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
                const order = yield this.razorpay.orders.create(options);
                return {
                    orderId: order.id,
                    amount: Number(order.amount),
                    currency: order.currency,
                };
            }
            catch (error) {
                console.error("Error creating Razorpay order:", error);
                if (error instanceof Error && "error" in error) {
                    const razorpayError = error.error;
                    throw new Error(`Failed to create Razorpay order: ${razorpayError.description || "Unknown error"}`);
                }
                throw new Error(`Failed to create Razorpay order: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    enrollCourse(userId, courseId, paymentDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const course = yield this.courseRepository.findById(courseId);
                if (!course) {
                    throw new Error("Course not found");
                }
                const enrollmentData = {
                    courseId: new mongoose.Types.ObjectId(courseId),
                    paymentId: paymentDetails.paymentMethod === 'razorpay' ? paymentDetails.razorpay_payment_id : paymentDetails.walletTransactionId || `wallet_${Date.now()}`,
                    orderId: paymentDetails.paymentMethod === 'razorpay' ? paymentDetails.razorpay_order_id : `wallet_order_${Date.now()}`,
                    amount: course.regularPrice,
                    currency: "INR",
                    status: "completed",
                    enrolledAt: new Date(),
                    paymentAmount: course.regularPrice,
                };
                const updatedStudent = yield this.studentRepository.updateEnrollments(userId, enrollmentData);
                if (!updatedStudent) {
                    throw new Error("Student not found");
                }
                yield this.courseRepository.incrementBuyCount(courseId);
            }
            catch (error) {
                console.error("Service error enrolling course:", error);
                throw new Error(`Failed to enroll course: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    getEnrolledCourses(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield this.studentRepository.findById(userId);
                if (!student)
                    return [];
                const courseIds = student.enrollments
                    ? student.enrollments.map((enrollment) => enrollment.courseId)
                    : [];
                const courses = yield this.courseRepository.findByIds(courseIds);
                const enrolledCourses = yield Promise.all(courses.map((course) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const enrollment = (_a = student.enrollments) === null || _a === void 0 ? void 0 : _a.find((enrollment) => enrollment.courseId.toString() === course._id.toString());
                    // Fetch review for this user and course
                    const review = yield this.reviewRepository.findByUserAndCourse(userId, course._id.toString());
                    return {
                        _id: course._id,
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
                        pricePaid: (enrollment === null || enrollment === void 0 ? void 0 : enrollment.amount) || 0,
                        enrolledDate: ((_b = enrollment === null || enrollment === void 0 ? void 0 : enrollment.enrolledAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || undefined,
                        status: (enrollment === null || enrollment === void 0 ? void 0 : enrollment.status) || "Unknown",
                        review: review || undefined, // Include review if it exists
                    };
                })));
                return enrolledCourses;
            }
            catch (error) {
                console.error("Error fetching enrolled courses:", error);
                throw new Error("Failed to retrieve enrolled courses");
            }
        });
    }
    cancelEnrollment(userId, courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
                    console.error(`Invalid ObjectId: userId=${userId}, courseId=${courseId}`);
                    throw new Error("Invalid user or course ID");
                }
                const student = yield this.studentRepository.findById(userId);
                if (!student) {
                    console.error(`Student not found for userId: ${userId}`);
                    throw new Error("Student not found");
                }
                if (!student.enrollments || student.enrollments.length === 0) {
                    console.error(`No enrollments found for student: ${userId}`);
                    throw new Error("No enrollments found for this student");
                }
                const enrollment = student.enrollments.find((e) => e.courseId.toString() === courseId);
                if (!enrollment) {
                    console.error(`Enrollment not found for courseId: ${courseId}`);
                    throw new Error("Enrollment not found for this course");
                }
                const enrolledAt = new Date(enrollment.enrolledAt);
                if (isNaN(enrolledAt.getTime())) {
                    console.error(`Invalid enrolledAt date for enrollment: ${courseId}`);
                    throw new Error("Invalid enrollment date");
                }
                const now = new Date();
                const daysSinceEnrollment = (now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceEnrollment > 7) {
                    console.error(`Refund period expired for enrollment: ${courseId}`);
                    throw new Error("Refund period has expired (7 days)");
                }
                const refundAmount = enrollment.amount || 0;
                if (refundAmount <= 0) {
                    console.error(`Invalid refund amount for enrollment: ${courseId}`);
                    throw new Error("No payment amount found for this enrollment");
                }
                const reason = `Refund for canceling course ${courseId}`;
                const wallet = yield this.walletRepository.refundWallet(enrollment.paymentId, userId, refundAmount, reason);
                if (!wallet) {
                    console.error(`Wallet refund failed for userId: ${userId}`);
                    throw new Error("Failed to process refund to wallet");
                }
                const updatedStudent = yield this.studentRepository.update(userId, {
                    $pull: { enrollments: { courseId } },
                });
                if (!updatedStudent) {
                    console.error(`Failed to update student enrollments for userId: ${userId}`);
                    throw new Error("Failed to update enrollment status");
                }
                console.log(`Course canceled successfully for userId: ${userId}, courseId: ${courseId}, refundAmount: ${refundAmount}`);
                return {
                    success: true,
                    refundAmount,
                    message: `Course canceled successfully. ₹${refundAmount} refunded to your wallet.`,
                };
            }
            catch (error) {
                console.error("Service: Error in cancelEnrollment:", {
                    message: error.message,
                    userId,
                    courseId,
                    stack: error.stack,
                });
                throw new Error(`Failed to cancel enrollment: ${error.message}`);
            }
        });
    }
    listLessons(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lessons = yield this.courseRepository.findByCourseId(courseId);
                return {
                    success: true,
                    message: 'Lesson retrieved successfully',
                    lessons,
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error(`Failed to list lessons: ${error.message}`);
                }
                else {
                    throw new Error("Failed to list lessons: Unknown error occurred");
                }
            }
        });
    }
}
export default new CourseService(courseRepository, categoryRepository, studentRepo, lessonRepository, walletRepository, reviewRepository);
