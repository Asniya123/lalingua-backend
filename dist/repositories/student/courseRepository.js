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
import LessonModel from "../../models/lessonModel.js";
import UserLessonCompletionModel from "../../models/lessonCompletionModel.js";
import userModel from "../../models/studentModel.js";
import courseModel from "../../models/courseModel.js";
import reviewModel from "../../models/reviewModel.js";
class CourseRepository {
    listCourses(page, limit, search, category, sortBy, language) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                let query = { isBlock: false };
                if (search) {
                    query.courseTitle = { $regex: search, $options: "i" };
                }
                if (category && category !== "all") {
                    query.category = category;
                }
                if (language && language !== "all") {
                    query.language = language;
                }
                let sort = {};
                if (sortBy === "popular") {
                    sort.buyCount = -1;
                }
                else if (sortBy === "priceAsc") {
                    sort.regularPrice = 1;
                }
                else if (sortBy === "priceDesc") {
                    sort.regularPrice = -1;
                }
                const courses = yield CourseModel.find(query)
                    .populate("category")
                    .populate("language")
                    .populate({
                    path: "tutorId",
                    select: "_id name profilePicture",
                })
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .exec();
                const [total, reviewStats] = yield Promise.all([
                    CourseModel.countDocuments(query).exec(),
                    reviewModel.aggregate([
                        { $match: { courseId: { $in: courses.map((c) => c._id) } } },
                        {
                            $group: {
                                _id: "$courseId",
                                averageRating: { $avg: "$rating" },
                                ratingCount: { $sum: 1 },
                            },
                        },
                    ]).exec(),
                ]);
                const reviewMap = new Map(reviewStats.map((stat) => [
                    stat._id.toString(),
                    { averageRating: stat.averageRating.toFixed(1), ratingCount: stat.ratingCount },
                ]));
                const mappedCourses = courses.map((course) => {
                    var _a;
                    const tutorIdObj = course.tutorId &&
                        typeof course.tutorId === "object" &&
                        "name" in course.tutorId &&
                        typeof course.tutorId.name === "string"
                        ? course.tutorId
                        : null;
                    const tutor = tutorIdObj
                        ? {
                            _id: tutorIdObj._id.toString(),
                            name: tutorIdObj.name || "Unknown Tutor",
                            profilePicture: tutorIdObj.profilePicture || undefined,
                        }
                        : undefined;
                    const tutorId = tutorIdObj
                        ? tutorIdObj
                        : course.tutorId instanceof Types.ObjectId
                            ? course.tutorId
                            : ((_a = course.tutorId) === null || _a === void 0 ? void 0 : _a.toString()) || "";
                    const reviewData = reviewMap.get(course._id.toString()) || {
                        averageRating: "0.0",
                        ratingCount: 0,
                    };
                    return Object.assign(Object.assign({}, course.toObject()), { tutorId,
                        tutor, averageRating: reviewData.averageRating, ratingCount: reviewData.ratingCount });
                });
                return { courses: mappedCourses, total };
            }
            catch (error) {
                console.error("Error in listCourses:", error);
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    findById(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const course = yield CourseModel.findById(courseId)
                    .populate({
                    path: "category",
                    select: "_id name",
                })
                    .populate({
                    path: "language",
                    select: "_id name",
                })
                    .populate({
                    path: "tutorId",
                    select: "_id name profilePicture",
                })
                    .exec();
                if (!course) {
                    return null;
                }
                const tutorIdObj = course.tutorId &&
                    typeof course.tutorId === "object" &&
                    "name" in course.tutorId &&
                    typeof course.tutorId.name === "string"
                    ? course.tutorId
                    : null;
                const tutor = tutorIdObj
                    ? {
                        _id: tutorIdObj._id.toString(),
                        name: tutorIdObj.name || "Unknown Tutor",
                        profilePicture: tutorIdObj.profilePicture || undefined,
                    }
                    : undefined;
                const sanitizedCourse = Object.assign(Object.assign({}, course.toObject()), { tutorId: tutorIdObj
                        ? tutorIdObj
                        : course.tutorId instanceof Types.ObjectId
                            ? course.tutorId
                            : ((_a = course.tutorId) === null || _a === void 0 ? void 0 : _a.toString()) || "", tutor, language: course.language &&
                        typeof course.language === "object" &&
                        "name" in course.language
                        ? course.language
                        : ((_b = course.language) === null || _b === void 0 ? void 0 : _b.toString()) || "Unknown", category: course.category &&
                        typeof course.category === "object" &&
                        "name" in course.category
                        ? course.category
                        : ((_c = course.category) === null || _c === void 0 ? void 0 : _c.toString()) || "Uncategorized" });
                return sanitizedCourse;
            }
            catch (error) {
                console.error("Error in findById:", error);
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    findByIds(courseIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const courses = yield CourseModel.find({ _id: { $in: courseIds } })
                    .populate("lessons")
                    .populate({
                    path: "tutorId",
                    select: "_id name profilePicture",
                })
                    .exec();
                const mappedCourses = courses.map((course) => {
                    var _a;
                    const tutorIdObj = course.tutorId &&
                        typeof course.tutorId === "object" &&
                        "name" in course.tutorId &&
                        typeof course.tutorId.name === "string"
                        ? course.tutorId
                        : null;
                    const tutor = tutorIdObj
                        ? {
                            _id: tutorIdObj._id.toString(),
                            name: tutorIdObj.name || "Unknown Tutor",
                            profilePicture: tutorIdObj.profilePicture || undefined,
                        }
                        : undefined;
                    const tutorId = tutorIdObj
                        ? tutorIdObj
                        : course.tutorId instanceof Types.ObjectId
                            ? course.tutorId
                            : ((_a = course.tutorId) === null || _a === void 0 ? void 0 : _a.toString()) || "";
                    return Object.assign(Object.assign({}, course.toObject()), { tutorId,
                        tutor });
                });
                return mappedCourses;
            }
            catch (error) {
                console.error("Error in findByIds:", error);
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    incrementBuyCount(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield CourseModel.findByIdAndUpdate(courseId, { $inc: { buyCount: 1 } }, { new: true }).exec();
            }
            catch (error) {
                console.error(`Error incrementing buy count for course ${courseId}:`, error);
                throw new Error("Failed to update course buy count");
            }
        });
    }
    getEnrolledCoursesByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield CourseModel.findById(userId)
                .populate("enrollments.courseId")
                .populate({
                path: "enrollments.courseId",
                populate: { path: "tutor", select: "name profilePicture" },
            })
                .exec();
            if (!course) {
                throw new Error("Course not found");
            }
            return course.enrollments;
        });
    }
    findByCourseId(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lessons = yield LessonModel.find({ courseId });
                return lessons;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error(`Failed to fetch lessons: ${error.message}`);
                }
                else {
                    throw new Error("Failed to fetch lessons: Unknown error occurred");
                }
            }
        });
    }
    createCompletion(userId, courseId, lessonId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const completion = new UserLessonCompletionModel({
                    userId,
                    courseId: new Types.ObjectId(courseId),
                    lessonId: new Types.ObjectId(lessonId),
                });
                return yield completion.save();
            }
            catch (error) {
                if (error.code === 11000) {
                    throw new Error('Lesson already completed');
                }
                throw error;
            }
        });
    }
    findCompletionsByUserAndCourse(userId, courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield UserLessonCompletionModel.find({
                userId,
                courseId: new Types.ObjectId(courseId)
            }).exec();
        });
    }
    findEnrollment(userId, courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield userModel.findOne({ _id: userId, "enrollments.courseId": new Types.ObjectId(courseId) }, { "enrollments.$": 1 });
            return user ? user.enrollments[0] : null;
        });
    }
    markCourseCompleted(userId, courseId, completedAt) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield userModel.updateOne({ _id: userId, "enrollments.courseId": new Types.ObjectId(courseId) }, {
                $set: {
                    "enrollments.$.isCompleted": true,
                    "enrollments.$.status": "completed",
                    "enrollments.$.completedAt": completedAt
                }
            });
            if (result.modifiedCount === 0) {
                throw new Error("No enrollment found to mark as completed");
            }
        });
    }
    getTotalLessonsCount(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const course = yield courseModel.findById(courseId);
            return ((_a = course === null || course === void 0 ? void 0 : course.lessons) === null || _a === void 0 ? void 0 : _a.length) || 0;
        });
    }
    updateEnrollmentCompletedLessons(userId, courseId, completedLessonsCount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield userModel.updateOne({ _id: userId, "enrollments.courseId": new Types.ObjectId(courseId) }, { $set: { "enrollments.$.completedLessons": completedLessonsCount } });
                if (result.modifiedCount === 0) {
                    throw new Error("No enrollment found to update or no changes made");
                }
                console.log(`Successfully updated completedLessons to ${completedLessonsCount} for user ${userId}, course ${courseId}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to update completed lessons count: ${errorMessage}`);
            }
        });
    }
}
export default new CourseRepository();
