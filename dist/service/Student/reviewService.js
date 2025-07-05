var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import reviewRepository from "../../repositories/student/reviewRepository.js";
import studentRepo from "../../repositories/student/studentRepo.js";
export class ReviewService {
    constructor(reviewRepository, studentRepo) {
        this.reviewRepository = reviewRepository;
        this.studentRepo = studentRepo;
    }
    createReview(reviewInput) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingReview = yield this.reviewRepository.findByUserAndCourse(reviewInput.userId, reviewInput.courseId);
                if (existingReview) {
                    return { success: false, message: "You have already reviewed this course" };
                }
                if (reviewInput.rating < 1 || reviewInput.rating > 5) {
                    return { success: false, message: "Rating must be between 1 and 5" };
                }
                if (!reviewInput.comment.trim()) {
                    return { success: false, message: "Review text cannot be empty" };
                }
                const review = yield reviewRepository.create(reviewInput);
                return { success: true, message: "Review submitted successfully", data: review };
            }
            catch (error) {
                console.error("Error creating review:", error);
                return { success: false, message: "Failed to submit review" };
            }
        });
    }
    getReviewById(reviewId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const review = yield this.reviewRepository.findById(reviewId);
                if (!review) {
                    return { success: false, message: "Review not found" };
                }
                return { success: true, message: "Review retrieved successfully", data: review };
            }
            catch (error) {
                console.error("Error fetching review:", error);
                return { success: false, message: "Failed to fetch review" };
            }
        });
    }
    getReviewsByCourse(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reviews = yield this.reviewRepository.findByCourse(courseId);
                return { success: true, message: "Reviews retrieved successfully", data: reviews };
            }
            catch (error) {
                console.error("Error fetching reviews:", error);
                return { success: false, message: "Failed to fetch reviews" };
            }
        });
    }
    updateReview(reviewId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
                    return { success: false, message: "Rating must be between 1 and 5" };
                }
                if (updateData.comment && !updateData.comment.trim()) {
                    return { success: false, message: "Review text cannot be empty" };
                }
                const review = yield this.reviewRepository.update(reviewId, updateData);
                if (!review) {
                    return { success: false, message: "Review not found" };
                }
                return { success: true, message: "Review updated successfully", data: review };
            }
            catch (error) {
                console.error("Error updating review:", error);
                return { success: false, message: "Failed to update review" };
            }
        });
    }
    deleteReview(reviewId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const success = yield this.reviewRepository.delete(reviewId);
                if (!success) {
                    return { success: false, message: "Review not found" };
                }
                return { success: true, message: "Review deleted successfully" };
            }
            catch (error) {
                console.error("Error deleting review:", error);
                return { success: false, message: "Failed to delete review" };
            }
        });
    }
    getStudentById(studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield studentRepo.findById(studentId);
                if (!student) {
                    return { success: false, message: "Student not found" };
                }
                return {
                    success: true,
                    message: "Student retrieved successfully",
                    data: {
                        _id: student._id,
                        name: student.name,
                        profilePicture: student.profilePicture,
                    },
                };
            }
            catch (error) {
                console.error("Error in student service getStudentById:", error);
                return { success: false, message: "Failed to fetch student" };
            }
        });
    }
}
export default new ReviewService(reviewRepository, studentRepo);
