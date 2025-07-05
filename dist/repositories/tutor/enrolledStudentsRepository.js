var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Types } from "mongoose";
import CourseModel from "../../models/courseModel.js";
import EnrollmentModel from "../../models/enrollmentModel.js";
import reviewModel from "../../models/reviewModel.js";
class EnrollmentRepository {
    getEnrolledStudentsByTutor(tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Service: Fetching courses for tutorId: ${tutorId}`);
                const courses = yield CourseModel.find({
                    tutorId: new Types.ObjectId(tutorId)
                }).select("_id courseTitle").lean();
                console.log(`Service: Found ${courses.length} courses for tutor`);
                if (!courses.length) {
                    console.log("Service: No courses found for this tutor");
                    return {
                        enrolledStudents: [],
                        total: 0
                    };
                }
                const courseIds = courses.map((course) => course._id);
                console.log(`Service: Course IDs: ${courseIds}`);
                const enrollments = yield EnrollmentModel.find({
                    courseId: { $in: courseIds },
                    status: { $ne: 'Cancelled' }
                })
                    .populate({
                    path: "studentId",
                    select: "_id name profilePicture email",
                })
                    .populate({
                    path: "courseId",
                    select: "_id courseTitle",
                })
                    .lean();
                console.log(`Service: Found ${enrollments.length} enrollments`);
                if (!enrollments.length) {
                    console.log("Service: No enrollments found for this tutor's courses");
                    return {
                        enrolledStudents: [],
                        total: 0
                    };
                }
                const studentIds = enrollments.map((e) => e.studentId._id);
                const reviews = yield reviewModel.find({
                    courseId: { $in: courseIds },
                    userId: { $in: studentIds },
                }).lean();
                console.log(`Service: Found ${reviews.length} reviews`);
                const reviewMap = new Map();
                reviews.forEach((review) => {
                    const key = `${review.courseId}_${review.userId}`;
                    reviewMap.set(key, review);
                });
                const enrolledStudents = enrollments.map((enrollment) => {
                    const reviewKey = `${enrollment.courseId._id}_${enrollment.studentId._id}`;
                    const review = reviewMap.get(reviewKey);
                    return {
                        student: {
                            _id: enrollment.studentId._id.toString(),
                            name: enrollment.studentId.name || "Unknown Student",
                            profilePicture: enrollment.studentId.profilePicture || "",
                        },
                        course: {
                            _id: enrollment.courseId._id.toString(),
                            courseTitle: enrollment.courseId.courseTitle || "Unknown Course",
                        },
                        enrolledAt: enrollment.enrolledAt,
                        pricePaid: enrollment.pricePaid || 0,
                        status: enrollment.status || 'Active',
                        review: review ? {
                            rating: review.rating,
                            comment: review.comment || "",
                            createdAt: review.createdAt,
                        } : undefined,
                    };
                });
                console.log(`Service: Returning ${enrolledStudents.length} enrolled students`);
                return {
                    enrolledStudents,
                    total: enrolledStudents.length
                };
            }
            catch (error) {
                console.error("Service: Error fetching enrolled students:", error);
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
}
export default new EnrollmentRepository;
