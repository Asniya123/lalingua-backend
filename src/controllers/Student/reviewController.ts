import { IReviewController, IReviewInput, IReviewService } from "../../interface/IReview";
import { Request, Response } from "express";

export default class ReviewController implements IReviewController {
    private reviewService: IReviewService
    
    constructor(reviewService: IReviewService) {
        this.reviewService = reviewService
    }
    
    async createReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const reviewInput: IReviewInput = {
      userId,
      courseId: req.body.courseId,
      rating: req.body.rating,
      comment: req.body.comment, 
    };
    const result = await this.reviewService.createReview(reviewInput);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error("Error in createReview:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
    
    async getReviewById(req: Request, res: Response): Promise<void> {
        try {
            const reviewId = req.params.reviewId;
            const result = await this.reviewService.getReviewById(reviewId);
            res.status(result.success ? 200 : 404).json(result);
        } catch (error) {
            console.error("Error in getReviewById:", error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }
    
    async getReviewsByCourse(req: Request, res: Response): Promise<void> {
        try {
            const courseId = req.params.courseId;
            const result = await this.reviewService.getReviewsByCourse(courseId);
            res.status(result.success ? 200 : 404).json(result);
        } catch (error) {
            console.error("Error in getReviewsByCourse:", error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }
    
    async updateReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const reviewId = req.params.reviewId;
    const updateData: Partial<IReviewInput> = {
      rating: req.body.rating,
      comment: req.body.comment, 
    };
    const result = await this.reviewService.updateReview(reviewId, updateData);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Error in updateReview:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
    
    async deleteReview(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }
            const reviewId = req.params.reviewId;
            const result = await this.reviewService.deleteReview(reviewId);
            res.status(result.success ? 200 : 404).json(result);
        } catch (error) {
            console.error("Error in deleteReview:", error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    async getStudentById(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId;
      const result = await this.reviewService.getStudentById(studentId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.error("Error in getStudentById controller:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
    
}