import { ICourse, ICourseRepository } from "../../interface/ICourse.js"; 
import CourseModel from "../../models/courseModel.js" 

class CourseRepository implements ICourseRepository {
  
    async addCourse(courseData: ICourse): Promise<ICourse | null> {

        try {
         
          const existingCourse = await CourseModel.findOne({ courseTitle: courseData.courseTitle });
          if (existingCourse) return null; 
          let result = await CourseModel.create(courseData);
   
          return result
        } catch (error) {
          throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
     }
    
     async listCourses(tutorId: string, page: number, limit: number): Promise<{ courses: ICourse[]; total: number }> {
      try {
        const skip = (page - 1) * limit;
        const [courses, total] = await Promise.all([
          CourseModel.find({ tutorId })
            .populate("category")
            .populate("language")
            .skip(skip)
            .limit(limit)
            .exec(),
          CourseModel.countDocuments({ tutorId }).exec(),
        ]);
      
        return { courses, total };
      } catch (error) {
        throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }


    
      async findById(courseId: string): Promise<ICourse | null> {
        return await CourseModel.findById(courseId).exec();
      }

      async editCourse(courseId: string, courseData: Partial<ICourse>): Promise<ICourse | null> {
        try {
          return await CourseModel.findByIdAndUpdate(courseId, courseData, { new: true, runValidators: true }).exec();
        } catch (error) {
          throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    
      async deleteCourse(courseId: string): Promise<boolean> {
        try {
          const result = await CourseModel.findByIdAndDelete(courseId).exec();
          return !!result;
        } catch (error) {
          throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

async getCourse(page: number, limit: number): Promise<{ courses: ICourse[]; total: number }> {
  const skip = (page - 1) * limit;
  const courses = await CourseModel.find({ isBlock: false})
    .populate("category", "name") 
    .populate("language", "name") 
    .skip(skip)
    .limit(limit)
    .lean();
  const total = await CourseModel.countDocuments({ isBlock: false});
  return { courses, total };
}


    async updateBlockStatus(courseId: string, isBlocked: boolean): Promise<ICourse> {
      const course = await CourseModel.findByIdAndUpdate(
          courseId,
          { isBlock: isBlocked },
          { new: true } 
      );
  
      if (!course) {
          throw new Error("Course not found");
      }
  
      return course;
  }
    
}

export default new CourseRepository