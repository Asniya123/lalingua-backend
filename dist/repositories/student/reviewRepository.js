var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import reviewModel from "../../models/reviewModel.js";
class ReviewRepository {
    create(reviewInput) {
        return __awaiter(this, void 0, void 0, function* () {
            const review = new reviewModel(reviewInput);
            const savedReview = yield review.save();
            return {
                _id: savedReview._id.toString(),
                userId: savedReview.userId,
                courseId: savedReview.courseId,
                rating: savedReview.rating,
                review: savedReview.review,
                createdAt: savedReview.createdAt,
                updatedAt: savedReview.updatedAt,
            };
        });
    }
    findById(reviewId) {
        return __awaiter(this, void 0, void 0, function* () {
            const review = yield reviewModel.findById(reviewId).exec();
            if (!review)
                return null;
            return {
                _id: review._id.toString(),
                userId: review.userId,
                courseId: review.courseId,
                rating: review.rating,
                review: review.review,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            };
        });
    }
    findByUserAndCourse(userId, courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const review = yield reviewModel.findOne({ userId, courseId }).exec();
            if (!review)
                return null;
            return {
                _id: review._id.toString(),
                userId: review.userId,
                courseId: review.courseId,
                rating: review.rating,
                review: review.review,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            };
        });
    }
    findByCourse(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const reviews = yield reviewModel.find({ courseId }).exec();
            return reviews.map((review) => ({
                _id: review._id.toString(),
                userId: review.userId,
                courseId: review.courseId,
                rating: review.rating,
                review: review.review,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            }));
        });
    }
    update(reviewId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const review = yield reviewModel.findByIdAndUpdate(reviewId, { $set: updateData }, { new: true }).exec();
            if (!review)
                return null;
            return {
                _id: review._id.toString(),
                userId: review.userId,
                courseId: review.courseId,
                rating: review.rating,
                review: review.review,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            };
        });
    }
    delete(reviewId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield reviewModel.findByIdAndDelete(reviewId).exec();
            return !!result;
        });
    }
}
export default new ReviewRepository;
