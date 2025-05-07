import { Request, Response } from "express";
import { ICourse, ICourseController, ICourseService } from "../../interface/ICourse.js";

export default class CourseController implements ICourseController{
  private courseService: ICourseService; 

  constructor(courseService: ICourseService) {
      this.courseService = courseService;
      this.getCourse = this.getCourse.bind(this); 
  }

  async addCourse(req: Request, res: Response): Promise<void> {
    try {
      if(!req.tutor || !req.tutor._id){
        res.status(403).json({error: 'Unautherized access'})
        return
      }

      const tutorId = req.tutor._id
      const { courseTitle, imageUrl, category, language, description, regularPrice } = req.body;
  
      if (!courseTitle || !imageUrl || !category || !language || !description || regularPrice <= 0) {
        res.status(400).json({ error: "All fields are required, and price must be greater than 0." });
        return;
      }
  
      const course = await this.courseService.addCourse({
        courseTitle,
        imageUrl,
        category,
        language,
        description,
        regularPrice,
        tutorId
      });
      if (!course) {
        res.status(400).json({ error: "Failed to create course" });
        return;
      }
      const sanitizedCourse: ICourse = {
        courseTitle: course.courseTitle,
        imageUrl: course.imageUrl,
        category: course.category,
        language: course.language,
        description: course.description,
        regularPrice: course.regularPrice,
        buyCount: course.buyCount || 0,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        tutorId: course.tutorId,
        _id: ""
      };
  
      res.status(201).json({ message: "Course added successfully", course: sanitizedCourse });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to add course" });
    }
  }
    
  async listCourses(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tutor?._id) {
        res.status(403).json({ message: 'Unauthorized access' });
        return;
      }

      const tutorId = req.tutor._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const { courses, total } = await this.courseService.listCourses(tutorId, page, limit);
      res.status(200).json({ message: 'Courses retrieved successfully', courses, total });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch courses' });
    }
  }
    
      async getCourse(req: Request, res: Response): Promise<void> {
        try {
          const { courseId } = req.params;
          if (!courseId) {
            res.status(400).json({ error: "Course ID is required" });
            return;
          }
    
          const course = await this.courseService.getCourse(courseId);
          if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
          }
    
          res.status(200).json(course);
        } catch (error) {
          console.error("Error fetching course:", error);
          res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to fetch course",
          });
        }
      }
    
      async editCourse(req: Request, res: Response): Promise<void> {
        try {
          const { courseId } = req.params;
          const courseData = req.body;
          if (!courseId) {
            res.status(400).json({ error: "Course ID is required" });
            return;
          }
    
          const course = await this.courseService.editCourse(courseId, courseData);
          if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
          }
    
          res.status(200).json({ message: "Course updated successfully", course });
        } catch (error) {
          console.error("Error updating course:", error);
          res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to update course",
          });
        }
      }
    
      async deleteCourse(req: Request, res: Response): Promise<void> {
        try {
          const { courseId } = req.params;
          if (!courseId) {
            res.status(400).json({ error: "Course ID is required" });
            return;
          }
    
          const success = await this.courseService.deleteCourse(courseId);
          if (!success) {
            res.status(404).json({ error: "Course not found" });
            return;
          }
    
          res.status(200).json({ message: "Course deleted successfully" });
        } catch (error) {
          res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete course" });
        }
      }
}