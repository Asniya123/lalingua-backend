import mongoose, { Types } from "mongoose";
import { ICourse, ISCourseRepository, ITutorDisplay, T } from "../../interface/ICourse.js";
import CourseModel from "../../models/courseModel.js";
import { IEnrollment } from "../../interface/IStudent.js";
import { ILesson } from "../../interface/ILesson.js";
import LessonModel from "../../models/lessonModel.js";


class CourseRepository implements ISCourseRepository {
 
  async listCourses(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    sortBy?: string,
    language?: string 
  ): Promise<{ courses: ICourse[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      let query: any = { isBlock: false }; 
  
      if (search) {
        query.courseTitle = { $regex: search, $options: "i" };
      }
  
      if (category && category !== "all") {
        query.category = category;
      }
  
      if (language && language !== "all") { 
        query.language = language;
      }
  
      let sort: any = {};
      if (sortBy === "popular") {
        sort.buyCount = -1;
      } else if (sortBy === "priceAsc") {
        sort.regularPrice = 1;
      } else if (sortBy === "priceDesc") {
        sort.regularPrice = -1;
      }
  
      const [courses, total] = await Promise.all([
        CourseModel.find(query)
          .populate('category')
          .populate('language')
          .populate({
            path: 'tutorId',
            select: '_id name profilePicture',
          })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        CourseModel.countDocuments(query).exec(),
      ]);
  
      const mappedCourses = courses.map(course => {
        const tutorIdObj = course.tutorId && typeof course.tutorId === 'object' && 'name' in course.tutorId && typeof course.tutorId.name === 'string'
          ? (course.tutorId as ITutorDisplay)
          : null;
  
        const tutor: ITutorDisplay | undefined = tutorIdObj
          ? {
              _id: tutorIdObj._id.toString(),
              name: tutorIdObj.name || 'Unknown Tutor',
              profilePicture: tutorIdObj.profilePicture || undefined,
            }
          : undefined;
  
        const tutorId: string | Types.ObjectId | ITutorDisplay = tutorIdObj
          ? tutorIdObj
          : course.tutorId instanceof Types.ObjectId
          ? course.tutorId
          : course.tutorId?.toString() || '';
  
        return {
          ...course.toObject(),
          tutorId,
          tutor,
        };
      });
  

      return { courses: mappedCourses, total };
    } catch (error) {
      console.error('Error in listCourses:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
     

  async findById(courseId: string): Promise<ICourse | null> {
    try {
      const course = await CourseModel.findById(courseId)
        .populate({
          path: 'category',
          select: '_id name',
        })
        .populate({
          path: 'language',
          select: '_id name',
        })
        .populate({
          path: 'tutorId',
          select: '_id name profilePicture',
        })
        .exec();
  
      if (!course) {
        return null;
      }
  
      const tutorIdObj = course.tutorId && typeof course.tutorId === 'object' && 'name' in course.tutorId && typeof course.tutorId.name === 'string'
        ? (course.tutorId as ITutorDisplay)
        : null;
  
      const tutor: ITutorDisplay | undefined = tutorIdObj
        ? {
            _id: tutorIdObj._id.toString(),
            name: tutorIdObj.name || 'Unknown Tutor',
            profilePicture: tutorIdObj.profilePicture || undefined,
          }
        : undefined;
  
      const sanitizedCourse: ICourse = {
        ...course.toObject(),
        tutorId: tutorIdObj
          ? tutorIdObj
          : course.tutorId instanceof Types.ObjectId
          ? course.tutorId
          : course.tutorId?.toString() || '',
        tutor,
        language: course.language && typeof course.language === 'object' && 'name' in course.language
          ? course.language
          : course.language?.toString() || 'Unknown',
        category: course.category && typeof course.category === 'object' && 'name' in course.category
          ? course.category
          : course.category?.toString() || 'Uncategorized',
      };
  
     
      return sanitizedCourse;
    } catch (error) {
      console.error('Error in findById:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findByIds(courseIds: mongoose.Types.ObjectId[]): Promise<ICourse[]> {
    try {
      const courses = await CourseModel.find({ _id: { $in: courseIds } })
        .populate('lessons')
        .populate({
          path: 'tutorId',
          select: '_id name profilePicture',
        })
        .exec();
  
      // Map courses to include tutor field, consistent with listCourses
      const mappedCourses = courses.map(course => {
        const tutorIdObj = course.tutorId && typeof course.tutorId === 'object' && 'name' in course.tutorId && typeof course.tutorId.name === 'string'
          ? (course.tutorId as ITutorDisplay)
          : null;
  
        const tutor: ITutorDisplay | undefined = tutorIdObj
          ? {
              _id: tutorIdObj._id.toString(),
              name: tutorIdObj.name || 'Unknown Tutor',
              profilePicture: tutorIdObj.profilePicture || undefined,
            }
          : undefined;
  
        const tutorId: string | Types.ObjectId | ITutorDisplay = tutorIdObj
          ? tutorIdObj
          : course.tutorId instanceof Types.ObjectId
          ? course.tutorId
          : course.tutorId?.toString() || '';
  
        return {
          ...course.toObject(),
          tutorId,
          tutor,
        };
      });
  

      return mappedCourses;
    } catch (error) {
      console.error('Error in findByIds:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

    async incrementBuyCount(courseId: string): Promise<ICourse | null> {
        try {
          return await CourseModel.findByIdAndUpdate(
            courseId,
            { $inc: { buyCount: 1 } },
            { new: true }
          ).exec();
        } catch (error) {
          console.error(`Error incrementing buy count for course ${courseId}:`, error);
          throw new Error("Failed to update course buy count");
        }
    }

    async getEnrolledCoursesByUserId(userId: string): Promise<IEnrollment[]> {
      const course = await CourseModel.findById(userId)
          .populate<{ enrollments: IEnrollment[] }>('enrollments.courseId')
          .populate({
            path: 'enrollments.courseId',
            populate: { path: 'tutor', select: 'name profilePicture' },
          })
          .exec();
  
      if (!course) {
          throw new Error('Course not found');
      }
  
      return course.enrollments;
    }
  
    async findByCourseId(courseId: string): Promise<ILesson[]> {
      try {
        const lessons = await LessonModel.find({ courseId });
        return lessons as ILesson[];
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to fetch lessons: ${error.message}`);
        } else {
          throw new Error("Failed to fetch lessons: Unknown error occurred");
        }
      }
    }
    
}

export default new CourseRepository();