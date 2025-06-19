import { IReview, IReviewInput, IReviewRepository } from "../../interface/IReview.js";
import reviewModel from "../../models/reviewModel.js";

class ReviewRepository implements IReviewRepository {
  async create(reviewInput: IReviewInput): Promise<IReview> {
    const review = new reviewModel(reviewInput);
    const savedReview = await review.save();
    return {
      _id: savedReview._id.toString(),
      userId: savedReview.userId,
      courseId: savedReview.courseId,
      rating: savedReview.rating,
      comment: savedReview.comment, 
      createdAt: savedReview.createdAt?.toString(),
      updatedAt: savedReview.updatedAt?.toString(),
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
      comment: review.comment,
      createdAt: review.createdAt?.toString(),
      updatedAt: review.updatedAt?.toString(),
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
      comment: review.comment, 
      createdAt: review.createdAt?.toString(),
      updatedAt: review.updatedAt?.toString(),
    };
  }

  async findByCourse(courseId: string): Promise<IReview[]> {
    const reviews = await reviewModel.find({ courseId }).exec();
    return reviews.map((review) => ({
      _id: review._id.toString(),
      userId: review.userId,
      courseId: review.courseId,
      rating: review.rating,
      comment: review.comment, 
      createdAt: review.createdAt?.toString(),
      updatedAt: review.updatedAt?.toString(),
    }));
  }

  async update(reviewId: string, updateData: Partial<IReviewInput>): Promise<IReview | null> {
    const review = await reviewModel
      .findByIdAndUpdate(reviewId, { $set: updateData }, { new: true })
      .exec();
    if (!review) return null;
    return {
      _id: review._id.toString(),
      userId: review.userId,
      courseId: review.courseId,
      rating: review.rating,
      comment: review.comment, 
      createdAt: review.createdAt?.toString(),
      updatedAt: review.updatedAt?.toString(),
    };
  }

  async delete(reviewId: string): Promise<boolean> {
    const result = await reviewModel.findByIdAndDelete(reviewId).exec();
    return !!result;
  }
}

export default new ReviewRepository();