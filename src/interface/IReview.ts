import { Types } from "mongoose";
import { Request, Response } from "express";

export interface IReview {
  _id?: string;
  courseId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  rating: number;
  review: string;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface IReviewInput {
  userId: string;
  courseId: string;
  rating: number;
  review: string;
}

export interface IReviewRepository{
    create(reviewInput: IReviewInput): Promise<IReview>
    findById(reviewId: string): Promise<IReview | null>
    findByUserAndCourse(userId: string, courseId: string): Promise<IReview | null>
    findByCourse(courseId: string): Promise<IReview[]>
    update(reviewId: string, updateData: Partial<IReviewInput>): Promise<IReview | null>
    delete(reviewId: string): Promise<boolean>
}

export interface IReviewService{
  createReview(reviewInput: IReviewInput): Promise<{ success: boolean; message: string; data?: IReview }>
  getReviewById(reviewId: string): Promise<{ success: boolean; message: string; data?: IReview }>
  getReviewsByCourse(courseId: string): Promise<{ success: boolean; message: string; data?: IReview[] }>
  updateReview(reviewId: string, updateData: Partial<IReviewInput>): Promise<{ success: boolean; message: string; data?: IReview }>
  deleteReview(reviewId: string): Promise<{ success: boolean; message: string }>
}


export interface IReviewController{
  createReview(req: Request, res: Response): Promise<void>
  getReviewById(req: Request, res: Response): Promise<void>
  getReviewsByCourse(req: Request, res: Response): Promise<void>
  updateReview(req: Request, res: Response): Promise<void>
  deleteReview(req: Request, res: Response): Promise<void>
}