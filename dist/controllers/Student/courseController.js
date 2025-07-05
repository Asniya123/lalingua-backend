var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObjectId } from "mongodb";
if (!process.env.ADMIN_ID) {
    throw new Error("ADMIN_ID is not set in the environment variables");
}
const ADMIN_ID = process.env.ADMIN_ID;
const TUTOR_SHARE = 0.7;
const ADMIN_SHARE = 0.3;
export default class CourseController {
    constructor(courseService, walletService) {
        this.courseService = courseService;
        this.walletService = walletService;
    }
    getCourses(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 9;
                const search = req.query.search;
                const category = req.query.category;
                const sortBy = req.query.sortBy;
                const language = req.query.language;
                const result = yield this.courseService.getCourse(page, limit, search, category, sortBy, language);
                res.status(200).json({
                    success: true,
                    courses: result.courses,
                    category: result.category,
                    total: result.total,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Error fetching courses",
                });
            }
        });
    }
    getCourseById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const { courseId } = req.params;
                if (!courseId) {
                    res
                        .status(400)
                        .json({ success: false, error: "Course ID is required" });
                    return;
                }
                const { course, lesson } = yield this.courseService.getCourseById(courseId);
                if (!course) {
                    res.status(404).json({ success: false, error: "Course not found" });
                    return;
                }
                const sanitizedCourse = {
                    _id: ((_a = course._id) === null || _a === void 0 ? void 0 : _a.toString()) || new ObjectId().toString(),
                    courseTitle: course.courseTitle || "Untitled Course",
                    description: course.description || "No description available",
                    regularPrice: course.regularPrice || 0,
                    buyCount: course.buyCount || 0,
                    imageUrl: course.imageUrl || "",
                    category: course.category &&
                        typeof course.category === "object" &&
                        "name" in course.category
                        ? course.category
                        : ((_b = course.category) === null || _b === void 0 ? void 0 : _b.toString()) || "Uncategorized",
                    language: course.language &&
                        typeof course.language === "object" &&
                        "name" in course.language
                        ? course.language
                        : ((_c = course.language) === null || _c === void 0 ? void 0 : _c.toString()) || "Unknown",
                    isBlock: course.isBlock || false,
                    lessons: (lesson === null || lesson === void 0 ? void 0 : lesson.map((lesson) => {
                        var _a;
                        return ({
                            _id: ((_a = lesson._id) === null || _a === void 0 ? void 0 : _a.toString()) || "",
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
                        });
                    })) || [],
                    tutorId: course.tutorId &&
                        typeof course.tutorId === "object" &&
                        "name" in course.tutorId
                        ? course.tutorId
                        : ((_d = course.tutorId) === null || _d === void 0 ? void 0 : _d.toString()) || "",
                    tutor: course.tutor &&
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
                            typeof course.tutorId.name === "string"
                            ? {
                                _id: course.tutorId._id.toString(),
                                name: course.tutorId.name || "Unknown Tutor",
                                profilePicture: course.tutorId.profilePicture || undefined,
                            }
                            : undefined,
                };
                res.status(200).json({ success: true, course: sanitizedCourse });
            }
            catch (error) {
                console.error("Error in getCourseById:", error);
                res.status(500).json({ success: false, error: "Internal server error" });
            }
        });
    }
    createOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const orderResponse = yield this.courseService.createOrder(courseId, amount);
                res.status(200).json({
                    success: true,
                    orderId: orderResponse.orderId,
                    amount: orderResponse.amount,
                    currency: orderResponse.currency,
                });
            }
            catch (error) {
                console.error("Controller error creating order:", error);
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to create order",
                });
            }
        });
    }
    enrollCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { courseId, paymentId, orderId, signature, paymentMethod } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId || !courseId || !paymentMethod) {
                    throw new Error("User ID, course ID, and payment method are required");
                }
                let paymentDetails;
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
                }
                else if (paymentMethod === "wallet") {
                    const course = yield this.courseService.getCourseById(courseId);
                    if (!course || typeof course.regularPrice !== "number") {
                        throw new Error("Course not found");
                    }
                    const walletResponse = yield this.walletService.wallet_payment({
                        userId,
                        amount: course.regularPrice,
                    });
                    if (!walletResponse.success || !walletResponse.wallet) {
                        throw new Error(walletResponse.message || "Insufficient wallet balance");
                    }
                    const walletTransactionId = `wallet_tx_${Date.now()}`;
                    yield this.walletService.debitWallet(walletTransactionId, userId, course.regularPrice, `Payment for course ${courseId}`);
                    paymentDetails = {
                        paymentMethod: "wallet",
                        walletTransactionId,
                    };
                }
                else {
                    throw new Error("Invalid payment method");
                }
                const { enrollmentId, coursePrice, tutorId } = yield this.courseService.enrollCourse(userId, courseId, paymentDetails);
                const tutorShare = coursePrice * TUTOR_SHARE;
                const adminShare = coursePrice * ADMIN_SHARE;
                yield this.walletService.creditTutorWallet(enrollmentId, tutorId, tutorShare, `Tutor share for course ${courseId} enrollment`);
                yield this.walletService.creditAdminWallet(enrollmentId, ADMIN_ID, adminShare, `Admin share for course ${courseId} enrollment`);
                res.status(200).json({ success: true, message: "Enrollment successful" });
            }
            catch (error) {
                console.error("Controller: Error enrolling course:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 400
                            : error.message.includes("Insufficient")
                                ? 400
                                : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to enroll course",
                });
            }
        });
    }
    getEnrolledCourses(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.params.userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
                if (!userId) {
                    res.status(401).json({ success: false, message: "Unauthorized" });
                    return;
                }
                const courses = yield this.courseService.getEnrolledCourses(userId);
                res
                    .status(200)
                    .json({
                    success: true,
                    message: "Enrolled courses retrieved successfully",
                    courses,
                });
            }
            catch (error) {
                console.error("Error in getEnrolledCourses:", error);
                res
                    .status(500)
                    .json({
                    success: false,
                    message: error instanceof Error
                        ? error.message
                        : "Error fetching enrolled courses",
                });
            }
        });
    }
    cancelEnrollment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, courseId } = req.params;
            try {
                const result = yield this.courseService.cancelEnrollment(userId, courseId);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Error canceling enrollment",
                });
            }
        });
    }
    listLessons(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { courseId } = req.params;
                if (!courseId) {
                    res
                        .status(400)
                        .json({ success: false, message: "Course ID is required" });
                    return;
                }
                const result = yield this.courseService.listLessons(courseId);
                res.status(200).json(result);
            }
            catch (error) {
                if (error instanceof Error) {
                    res.status(500).json({ success: false, message: error.message });
                }
                else {
                    res
                        .status(500)
                        .json({ success: false, message: "Unknown error occurred" });
                }
            }
        });
    }
    completeLesson(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.courseService.completeLesson(userId, courseId, lessonId);
                if (result.success) {
                    res.status(200).json({ success: true, message: "Lesson marked as completed" });
                }
                else {
                    res.status(400).json({ success: false, message: result.message });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                console.error('Error in completeLesson controller:', errorMessage);
                res.status(500).json({ success: false, message: errorMessage });
            }
        });
    }
    getCompletedLessons(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const completedLessons = yield this.courseService.getCompletedLessons(userId, courseId);
                res.status(200).json({
                    success: true,
                    completedLessons,
                    count: completedLessons.length
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                console.error('Error in getCompletedLessons controller:', errorMessage);
                res.status(500).json({ success: false, message: errorMessage });
            }
        });
    }
    markCourseCompleted(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const result = yield this.courseService.markCourseCompleted(userId, courseId);
                if (result.success) {
                    res.status(200).json({
                        success: true,
                        message: result.message || "Course marked as completed",
                        isCompleted: result.isCompleted
                    });
                }
                else {
                    res.status(400).json({ success: false, message: result.message });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                console.error('Error in markCourseCompleted controller:', errorMessage);
                res.status(500).json({ success: false, message: errorMessage });
            }
        });
    }
}
