import { IReview, IReviewInput, IReviewRepository, IReviewService, IStudentReview} from "../../interface/IReview.js";
import { IStudentRepository } from "../../interface/IStudent.js";
import reviewRepository from "../../repositories/student/reviewRepository.js";
import studentRepo from "../../repositories/student/studentRepo.js";

export class ReviewService implements IReviewService{
    private reviewRepository: IReviewRepository
    private studentRepo: IStudentRepository

    constructor(
        reviewRepository: IReviewRepository,
        studentRepo: IStudentRepository
    ){
        this.reviewRepository = reviewRepository
        this.studentRepo = studentRepo
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
      if (!reviewInput.comment.trim()) {
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
      if (updateData.comment && !updateData.comment.trim()) {
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

  async getStudentById(studentId: string): Promise<{ success: boolean; message: string; data?: IStudentReview }> {
    try {
      const student = await studentRepo.findById(studentId);
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
    } catch (error) {
      console.error("Error in student service getStudentById:", error);
      return { success: false, message: "Failed to fetch student" };
    }
  }

  
}

export default new ReviewService(reviewRepository, studentRepo)