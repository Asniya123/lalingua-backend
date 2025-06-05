import { IReview, IReviewInput, IReviewRepository } from "../../interface/IReview.js";
import LessonModel from "../../models/lessonModel.js";
import reviewModel from "../../models/reviewModel.js";

class ReviewRepository implements IReviewRepository{
    async create(reviewInput: IReviewInput): Promise<IReview> {
    const review = new reviewModel(reviewInput);
    const savedReview = await review.save();
    return {
      _id: savedReview._id.toString(),
      userId: savedReview.userId,
      courseId: savedReview.courseId,
      rating: savedReview.rating,
      review: savedReview.review,
      createdAt: savedReview.createdAt,
      updatedAt: savedReview.updatedAt,
    };
  }

  async findById(reviewId: string): Promise<IReview | null> {
    const review = await reviewModel.findById(reviewId).exec();
    if (!review) return null;
    return {
      _id: review._id.toString(),
      userId: review.userId,
      courseId: review.courseId,
      rating: review.rating,
      review: review.review,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<IReview | null> {
    const review = await reviewModel.findOne({ userId, courseId }).exec();
    if (!review) return null;
    return {
      _id: review._id.toString(),
      userId: review.userId,
      courseId: review.courseId,
      rating: review.rating,
      review: review.review,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async findByCourse(courseId: string): Promise<IReview[]> {
    const reviews = await reviewModel.find({ courseId }).exec();
    return reviews.map((review) => ({
      _id: review._id.toString(),
      userId: review.userId,
      courseId: review.courseId,
      rating: review.rating,
      review: review.review,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));
  }

  async update(reviewId: string, updateData: Partial<IReviewInput>): Promise<IReview | null> {
    const review = await reviewModel.findByIdAndUpdate(
      reviewId,
      { $set: updateData },
      { new: true }
    ).exec();
    if (!review) return null;
    return {
      _id: review._id.toString(),
      userId: review.userId,
      courseId: review.courseId,
      rating: review.rating,
      review: review.review,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async delete(reviewId: string): Promise<boolean> {
    const result = await reviewModel.findByIdAndDelete(reviewId).exec();
    return !!result;
  }
}

export default new ReviewRepository