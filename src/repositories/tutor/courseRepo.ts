import { CreateCourseDTO, ICourse, ICourseRepository } from "../../interface/ICourse.js"; 
import courseModel from "../../models/courseModel.js";
import CourseModel from "../../models/courseModel.js" 

class CourseRepository implements ICourseRepository {
  
  async addCourse(courseData: CreateCourseDTO): Promise<ICourse | null> {
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

    const coursesAggregation = await courseModel
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'courseId',
            as: 'reviews',
          },
        },
        {
          $lookup: {
            from: 'users',
            let: { courseId: '$_id' },
            pipeline: [
              { $match: { $expr: { $in: ['$$courseId', '$enrollments.courseId'] } } },
            ],
            as: 'enrolledUsers',
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryData',
          },
        },
        {
          $lookup: {
            from: 'languages',
            localField: 'language',
            foreignField: '_id',
            as: 'languageData',
          },
        },
        {
          $project: {
            _id: 1,
            courseTitle: 1,
            tutorId: 1,
            regularPrice: { $ifNull: ['$regularPrice', 0] },
            status: 1,
            createdAt: 1,
            imageUrl: { $ifNull: ['$imageUrl', ''] },
            description: { $ifNull: ['$description', ''] },
            category: { $arrayElemAt: ['$categoryData.name', 0] },
            language: { $arrayElemAt: ['$languageData.name', 0] },
            averageRating: { $avg: '$reviews.rating' },
            totalReviews: { $size: '$reviews' },
            totalStudents: { $size: '$enrolledUsers' },
            totalRevenue: { $multiply: [{ $size: '$enrolledUsers' }, { $multiply: [{ $ifNull: ['$regularPrice', 0] }, 0.3] }] },
          },
        },
        { $skip: skip },
        { $limit: limit },
      ]);

    const total = await courseModel.countDocuments(query);
    console.log(`getCourse: Total courses counted: ${total}`); // Debug log

    const courses: ICourse[] = coursesAggregation.map((course) => ({
      _id: course._id.toString(),
      courseTitle: course.courseTitle || 'Untitled',
      tutorId: course.tutorId.toString(),
      regularPrice: course.regularPrice || 0,
      status: course.status,
      createdAt: course.createdAt ? new Date(course.createdAt) : undefined,
      imageUrl: course.imageUrl || '',
      description: course.description || '',
      category: course.category || 'N/A',
      language: course.language || 'N/A',
      averageRating: course.averageRating || 0,
      totalReviews: course.totalReviews || 0,
      totalStudents: course.totalStudents || 0,
      totalRevenue: course.totalRevenue || 0,
    }));

    console.log(`getCourse: Returning ${courses.length} courses, total: ${total}`); // Debug log
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