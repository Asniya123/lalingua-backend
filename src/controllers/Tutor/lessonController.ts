import { ILesson, ILessonController, ILessonInput, ILessonService } from "../../interface/ILesson.js";
import {Request, Response} from 'express'

export default class LessonController implements ILessonController{
    private lessonService: ILessonService
    static addLesson: any;

    constructor(lessonService: ILessonService){
        this.lessonService = lessonService
    }

    async addLesson(req: Request, res: Response): Promise<void> {
      try {
        const { title, description, videoUrl, courseId, introVideoUrl} = req.body;
    
        if (!title || !description || !videoUrl || !courseId || !introVideoUrl) {
          res.status(400).json({ error: 'All fields are required' });
          return;
        }
    
        const lesson = await this.lessonService.addLesson({
          title,
          description,
          videoUrl,
          courseId,
          introVideoUrl,
        });
    
        res.status(201).json({ message: 'Lesson added successfully', lesson });
      } catch (error) {
        console.error('Controller error in addLesson:', error);
        res.status(400).json({
          error: error instanceof Error ? error.message : 'Failed to add lesson',
        });
      }
    }


    async listLesson(req: Request, res: Response): Promise<void> {
      try {
        const courseId = req.params.courseId as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;
    
        if (!courseId) {
          res.status(400).json({ success: false, message: "Course ID is required" });
          return;
        }
    
        const { lessons, total } = await this.lessonService.listLesson(courseId, page, limit);
        res.status(200).json({
          success: true,
          message: "Lessons retrieved successfully",
          lessons,
          total,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch lessons";
        console.error("Controller error in listLesson:", error);
        res.status(500).json({
          success: false,
          message: errorMessage,
        });
      }
    }
    

      async getLesson(req: Request<{ lessonId: string }>, res: Response): Promise<void> {
        try {
          const { lessonId } = req.params;

          const lesson = await this.lessonService.getLesson(lessonId);
          res.status(200).json({ message: "Lesson retrieved successfully", lesson });
        } catch (error) {
          res.status(404).json({
            message: error instanceof Error ? error.message : "Failed to fetch lesson",
          });
        }
      }

      async editLesson(req: Request<{ lessonId: string }, {}, Partial<ILesson>>, res: Response): Promise<void> {
        try {
          const { lessonId } = req.params;
          const { title, description, videoUrl, courseId } = req.body;
    
          if (!lessonId) {
            res.status(400).json({ error: "Lesson ID is required" });
            return;
          }
    
          const lessonData: Partial<ILesson> = {
            title,
            description,
            videoUrl,
            courseId,
          };
    
          const updatedLesson = await this.lessonService.editLesson(lessonId, lessonData);
          res.status(200).json({ message: "Lesson updated successfully", lesson: updatedLesson });
        } catch (error) {
          console.error("Edit lesson error:", error);
          res.status(400).json({
            error: error instanceof Error ? error.message : "Failed to update lesson",
          });
        }
      }
    
      async deleteLesson(req: Request<{ lessonId: string }>, res: Response): Promise<void> {
        try {
          const { lessonId } = req.params;
    
          if (!lessonId) {
            res.status(400).json({ error: "Lesson ID is required" });
            return;
          }
    
          await this.lessonService.deleteLesson(lessonId);
          res.status(200).json({ message: "Lesson deleted successfully" });
        } catch (error) {
          console.error("Delete lesson error:", error);
          res.status(400).json({
            error: error instanceof Error ? error.message : "Failed to delete lesson",
          });
        }
      }
}