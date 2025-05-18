import mongoose, { Schema, Document, Types } from "mongoose";
import { Request, Response } from "express";

export interface ILesson extends Document {
  _id: string
  title: string;
  description: string;
  videoUrl: string;
  courseId: Types.ObjectId;
  introVideoUrl: string;
  syllabus?: { title: string; description?: string };
}

export interface ILessonInput {
  title: string;
  description: string;
  videoUrl: string;
  courseId: string | Schema.Types.ObjectId; 
  introVideoUrl: string;
  syllabus?: { title: string; description?: string };
}

export interface ILessonRepository {
  addLesson(lessonData: ILessonInput): Promise<ILesson | null>;
  getLessonsByCourseId(courseId: string): Promise<ILesson[]>
  listLesson(courseId: string, page: number, limit: number): Promise<{ lessons: ILesson[]; total: number }>
  getLesson(lessonId: string): Promise<ILesson | null>;
  editLesson(lessonId: string, lessonData: Partial<ILesson>): Promise<ILesson | null>;
  deleteLesson(lessonId: string): Promise<boolean>;
  courseLesson(courseId:string):Promise<ILesson[]>
}

export interface ILessonService {
  addLesson(lessonData: ILessonInput): Promise<ILesson | null>;
  listLesson(courseId: string, page: number, limit: number): Promise<{ lessons: ILesson[]; total: number }>
  getLesson(lessonId: string): Promise<ILesson | null>;
  editLesson(lessonId: string, lessonData: Partial<ILesson>): Promise<ILesson | null>;
  deleteLesson(lessonId: string): Promise<boolean>;
}

export interface ILessonController {
  addLesson(req: Request, res: Response): Promise<void>;
  listLesson(req: Request, res: Response): Promise<void>;
  getLesson(req: Request<{ lessonId: string }>, res: Response): Promise<void>
  editLesson(req: Request<{ lessonId: string }, {}, Partial<ILesson>>, res: Response): Promise<void>;
  deleteLesson(req: Request<{ lessonId: string }>, res: Response): Promise<void>;
}