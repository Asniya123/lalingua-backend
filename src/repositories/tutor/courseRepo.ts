import { ICourse, ICourseRepository } from "../../interface/ICourse.js"; 
import CourseModel from "../../models/courseModel.js" 

class CourseRepository implements ICourseRepository {
  
  async addCourse(courseData: Omit<ICourse, '_id'>): Promise<ICourse | null> {
    try {
      const existingCourse = await CourseModel.findOne({ courseTitle: courseData.courseTitle });
      if (existingCourse) return null;
  
      const result = await CourseModel.create(courseData);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
    
     async listCourses(tutorId: string, page: number, limit: number, search?: string): Promise<{ courses: ICourse[]; total: number }> {
  try {
    const skip = (page - 1) * limit;

    // Build the base query with tutorId
    let baseQuery: any = { tutorId };

    // Add search conditions to the base query if search term exists
    if (search && search.trim()) {
      baseQuery = {
        tutorId,
        $or: [
          { courseTitle: { $regex: search.trim(), $options: 'i' } }, // Changed from 'name' to 'courseTitle'
          { description: { $regex: search.trim(), $options: 'i' } },
        ],
      };
    }

    const [courses, total] = await Promise.all([
      CourseModel.find(baseQuery)
        .populate("category")
        .populate("language")
        .skip(skip)
        .limit(limit)
        .exec(),
      CourseModel.countDocuments(baseQuery).exec(), // Use the same query for counting
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

async getCourse(page: number, limit: number, search?: string): Promise<{ courses: ICourse[]; total: number }> {
    try {
        const skip = (page - 1) * limit;

        const query = search
            ? {
                $or: [
                    { courseTitle: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { 'category.name': { $regex: search, $options: 'i' } },
                    { 'language.name': { $regex: search, $options: 'i' } },
                ],
                isBlock: false,
            }
            : { isBlock: false };

        const [courses, total] = await Promise.all([
            CourseModel.find(query)
                .populate("category", "name")
                .populate("language", "name")
                .skip(skip)
                .limit(limit)
                .lean(),
            CourseModel.countDocuments(query),
        ]);

        return { courses, total };
    } catch (error) {
        console.error('Error in CourseRepository.getCourse:', error);
        throw new Error('Failed to fetch courses from database');
    }
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