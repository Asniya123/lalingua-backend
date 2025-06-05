import { IReview, IReviewInput, IReviewRepository, IReviewService } from "../../interface/IReview.js";
import reviewRepository from "../../repositories/student/reviewRepository.js";

export class ReviewService implements IReviewService{
    private reviewRepository: IReviewRepository

    constructor(
        reviewRepository: IReviewRepository
    ){
        this.reviewRepository = reviewRepository
    }

    async createReview(reviewInput: IReviewInput): Promise<{ success: boolean; message: string; data?: IReview }> {
    try {
      const existingReview = await this.reviewRepository.findByUserAndCourse(reviewInput.userId, reviewInput.courseId);
      if (existingReview) {
        return { success: false, message: "You have already reviewed this course" };
      }
      if (reviewInput.rating < 1 || reviewInput.rating > 5) {
        return { success: false, message: "Rating must be between 1 and 5" };
      }
      if (!reviewInput.review.trim()) {
        return { success: false, message: "Review text cannot be empty" };
      }
      const review = await reviewRepository.create(reviewInput);
      return { success: true, message: "Review submitted successfully", data: review };
    } catch (error) {
      console.error("Error creating review:", error);
      return { success: false, message: "Failed to submit review" };
    }
  }

  async getReviewById(reviewId: string): Promise<{ success: boolean; message: string; data?: IReview }> {
    try {
      const review = await this.reviewRepository.findById(reviewId);
      if (!review) {
        return { success: false, message: "Review not found" };
      }
      return { success: true, message: "Review retrieved successfully", data: review };
    } catch (error) {
      console.error("Error fetching review:", error);
      return { success: false, message: "Failed to fetch review" };
    }
  }

  async getReviewsByCourse(courseId: string): Promise<{ success: boolean; message: string; data?: IReview[] }> {
    try {
      const reviews = await this.reviewRepository.findByCourse(courseId);
      return { success: true, message: "Reviews retrieved successfully", data: reviews };
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return { success: false, message: "Failed to fetch reviews" };
    }
  }

  async updateReview(reviewId: string, updateData: Partial<IReviewInput>): Promise<{ success: boolean; message: string; data?: IReview }> {
    try {
      if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        return { success: false, message: "Rating must be between 1 and 5" };
      }
      if (updateData.review && !updateData.review.trim()) {
        return { success: false, message: "Review text cannot be empty" };
      }
      const review = await this.reviewRepository.update(reviewId, updateData);
      if (!review) {
        return { success: false, message: "Review not found" };
      }
      return { success: true, message: "Review updated successfully", data: review };
    } catch (error) {
      console.error("Error updating review:", error);
      return { success: false, message: "Failed to update review" };
    }
  }

  async deleteReview(reviewId: string): Promise<{ success: boolean; message: string }> {
    try {
      const success = await this.reviewRepository.delete(reviewId);
      if (!success) {
        return { success: false, message: "Review not found" };
      }
      return { success: true, message: "Review deleted successfully" };
    } catch (error) {
      console.error("Error deleting review:", error);
      return { success: false, message: "Failed to delete review" };
    }
  }
}

export default new ReviewService(reviewRepository)