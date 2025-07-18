import mongoose, { Types } from "mongoose";
import {
  ICourse,
  ISCourseRepository,
  ITutorDisplay,
  IUserLessonCompletion,
  T,
} from "../../interface/ICourse.js";
import CourseModel from "../../models/courseModel.js";
import { IEnrollment } from "../../interface/IStudent.js";
import { ILesson } from "../../interface/ILesson.js";
import LessonModel from "../../models/lessonModel.js";
import UserLessonCompletionModel from "../../models/lessonCompletionModel.js";
import userModel from "../../models/studentModel.js";
import courseModel from "../../models/courseModel.js";
import reviewModel from "../../models/reviewModel.js";

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

    
    const courses = await CourseModel.find(query)
      .populate("category")
      .populate("language")
      .populate({
        path: "tutorId",
        select: "_id name profilePicture",
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

  
    const [total, reviewStats] = await Promise.all([
      CourseModel.countDocuments(query).exec(),
      reviewModel.aggregate([
        { $match: { courseId: { $in: courses.map((c: any) => c._id) } } },
        {
          $group: {
            _id: "$courseId",
            averageRating: { $avg: "$rating" },
            ratingCount: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    const reviewMap = new Map(
      reviewStats.map((stat: any) => [
        stat._id.toString(),
        { averageRating: stat.averageRating.toFixed(1), ratingCount: stat.ratingCount },
      ])
    );

    const mappedCourses = courses.map((course: any) => {
      const tutorIdObj =
        course.tutorId &&
        typeof course.tutorId === "object" &&
        "name" in course.tutorId &&
        typeof course.tutorId.name === "string"
          ? (course.tutorId as ITutorDisplay)
          : null;

      const tutor: ITutorDisplay | undefined = tutorIdObj
        ? {
            _id: tutorIdObj._id.toString(),
            name: tutorIdObj.name || "Unknown Tutor",
            profilePicture: tutorIdObj.profilePicture || undefined,
          }
        : undefined;

      const tutorId: string | Types.ObjectId | ITutorDisplay = tutorIdObj
        ? tutorIdObj
        : course.tutorId instanceof Types.ObjectId
        ? course.tutorId
        : course.tutorId?.toString() || "";

      const reviewData = reviewMap.get(course._id.toString()) || {
        averageRating: "0.0",
        ratingCount: 0,
      };

      return {
        ...course.toObject(),
        tutorId,
        tutor,
        averageRating: reviewData.averageRating,
        ratingCount: reviewData.ratingCount,
      };
    });

    return { courses: mappedCourses, total };
  } catch (error) {
    console.error("Error in listCourses:", error);
    throw new Error(
      `Database error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

  async findById(courseId: string): Promise<ICourse | null> {
    try {
      const course = await CourseModel.findById(courseId)
        .populate({
          path: "category",
          select: "_id name",
        })
        .populate({
          path: "language",
          select: "_id name",
        })
        .populate({
          path: "tutorId",
          select: "_id name profilePicture",
        })
        .exec();

      if (!course) {
        return null;
      }

      const tutorIdObj =
        course.tutorId &&
        typeof course.tutorId === "object" &&
        "name" in course.tutorId &&
        typeof course.tutorId.name === "string"
          ? (course.tutorId as ITutorDisplay)
          : null;

      const tutor: ITutorDisplay | undefined = tutorIdObj
        ? {
            _id: tutorIdObj._id.toString(),
            name: tutorIdObj.name || "Unknown Tutor",
            profilePicture: tutorIdObj.profilePicture || undefined,
          }
        : undefined;

      const sanitizedCourse: ICourse = {
        ...course.toObject(),
        tutorId: tutorIdObj
          ? tutorIdObj
          : course.tutorId instanceof Types.ObjectId
          ? course.tutorId
          : course.tutorId?.toString() || "",
        tutor,
        language:
          course.language &&
          typeof course.language === "object" &&
          "name" in course.language
            ? course.language
            : course.language?.toString() || "Unknown",
        category:
          course.category &&
          typeof course.category === "object" &&
          "name" in course.category
            ? course.category
            : course.category?.toString() || "Uncategorized",
      };

      return sanitizedCourse;
    } catch (error) {
      console.error("Error in findById:", error);
      throw new Error(
        `Database error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async findByIds(courseIds: mongoose.Types.ObjectId[]): Promise<ICourse[]> {
    try {
      const courses = await CourseModel.find({ _id: { $in: courseIds } })
        .populate("lessons")
        .populate({
          path: "tutorId",
          select: "_id name profilePicture",
        })
        .exec();

      const mappedCourses = courses.map((course) => {
        const tutorIdObj =
          course.tutorId &&
          typeof course.tutorId === "object" &&
          "name" in course.tutorId &&
          typeof course.tutorId.name === "string"
            ? (course.tutorId as ITutorDisplay)
            : null;

        const tutor: ITutorDisplay | undefined = tutorIdObj
          ? {
              _id: tutorIdObj._id.toString(),
              name: tutorIdObj.name || "Unknown Tutor",
              profilePicture: tutorIdObj.profilePicture || undefined,
            }
          : undefined;

        const tutorId: string | Types.ObjectId | ITutorDisplay = tutorIdObj
          ? tutorIdObj
          : course.tutorId instanceof Types.ObjectId
          ? course.tutorId
          : course.tutorId?.toString() || "";

        return {
          ...course.toObject(),
          tutorId,
          tutor,
        };
      });

      return mappedCourses;
    } catch (error) {
      console.error("Error in findByIds:", error);
      throw new Error(
        `Database error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
      console.error(
        `Error incrementing buy count for course ${courseId}:`,
        error
      );
      throw new Error("Failed to update course buy count");
    }
  }

  async getEnrolledCoursesByUserId(userId: string): Promise<IEnrollment[]> {
    const course = await CourseModel.findById(userId)
      .populate<{ enrollments: IEnrollment[] }>("enrollments.courseId")
      .populate({
        path: "enrollments.courseId",
        populate: { path: "tutor", select: "name profilePicture" },
      })
      .exec();

    if (!course) {
      throw new Error("Course not found");
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

  async createCompletion(
    userId: string,
    courseId: string,
    lessonId: string
  ): Promise<IUserLessonCompletion> {
    try {
      const completion = new UserLessonCompletionModel({
        userId,
        courseId: new Types.ObjectId(courseId),
        lessonId: new Types.ObjectId(lessonId),
      });
      return await completion.save();
    } catch (error: any) {
     
      if (error.code === 11000) {
        throw new Error('Lesson already completed');
      }
      throw error;
    }
  }

  async findCompletionsByUserAndCourse(
    userId: string,
    courseId: string
  ): Promise<IUserLessonCompletion[]> {
    return await UserLessonCompletionModel.find({ 
      userId, 
      courseId: new Types.ObjectId(courseId) 
    }).exec();
  }

  async findEnrollment(userId: string, courseId: string): Promise<any> {
    const user = await userModel.findOne(
      { _id: userId, "enrollments.courseId": new Types.ObjectId(courseId) },
      { "enrollments.$": 1 }
    );
    return user ? user.enrollments[0] : null;
  }

  async markCourseCompleted(userId: string, courseId: string, completedAt: Date) {
  const result = await userModel.updateOne(
    { _id: userId, "enrollments.courseId": new Types.ObjectId(courseId) },
    { 
      $set: { 
        "enrollments.$.isCompleted": true, 
        "enrollments.$.status": "completed", 
        "enrollments.$.completedAt": completedAt 
      } 
    }
  );
  if (result.modifiedCount === 0) {
    throw new Error("No enrollment found to mark as completed");
  }
}

  
  async getTotalLessonsCount(courseId: string): Promise<number> {
    const course = await courseModel.findById(courseId);
    return course?.lessons?.length || 0;
  }

  async updateEnrollmentCompletedLessons(userId: string, courseId: string, completedLessonsCount: number): Promise<void> {
  try {
    const result = await userModel.updateOne(
      { _id: userId, "enrollments.courseId": new Types.ObjectId(courseId) },
      { $set: { "enrollments.$.completedLessons": completedLessonsCount } }
    );
    if (result.modifiedCount === 0) {
      throw new Error("No enrollment found to update or no changes made");
    }
    console.log(`Successfully updated completedLessons to ${completedLessonsCount} for user ${userId}, course ${courseId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to update completed lessons count: ${errorMessage}`);
  }
}
}

export default new CourseRepository();
