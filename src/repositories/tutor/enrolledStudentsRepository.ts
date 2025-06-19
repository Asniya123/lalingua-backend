import { Types } from "mongoose";
import { CourseDocument, IEnrolledStudent, IEnrollmentRepository, StudentDocument } from "../../interface/IEnrollment.js";
import CourseModel from "../../models/courseModel.js";
import EnrollmentModel from "../../models/enrollmentModel.js";
import reviewModel from "../../models/reviewModel.js";

class EnrollmentRepository implements IEnrollmentRepository{
   async getEnrolledStudentsByTutor(tutorId: string): Promise<IEnrolledStudent[]> {
    try {
      console.log(`Fetching courses for tutorId: ${tutorId}`);
      const courses = await CourseModel.find({ tutorId: new Types.ObjectId(tutorId) }).select("_id courseTitle");
      console.log(`Found ${courses.length} courses`);

      if (!courses.length) {
        console.log("No courses found for this tutor");
        return [];
      }

      const courseIds = courses.map((course) => course._id);
      console.log(`Course IDs: ${courseIds}`);

      const enrollments = await EnrollmentModel.find({ courseId: { $in: courseIds } })
        .populate<{ studentId: StudentDocument }>({
          path: "studentId",
          select: "_id name profilePicture",
        })
        .populate<{ courseId: CourseDocument }>({
          path: "courseId",
          select: "_id courseTitle",
        })
        .lean();
      console.log(`Found ${enrollments.length} enrollments`);

      const [reviews, lessonCounts] = await Promise.all([
        reviewModel.find({
          courseId: { $in: courseIds },
          userId: { $in: enrollments.map((e) => e.studentId._id) },
        }).lean(),
        CourseModel.aggregate([
          { $match: { _id: { $in: courseIds } } },
          {
            $lookup: {
              from: "lessons",
              localField: "_id",
              foreignField: "courseId",
              as: "lessons",
            },
          },
          {
            $project: {
              _id: 1,
              lessonCount: { $size: "$lessons" },
            },
          },
        ]),
      ]);
      console.log(`Found ${reviews.length} reviews and ${lessonCounts.length} lesson counts`);

      const reviewMap = new Map(reviews.map((review) => [`${review.courseId}_${review.userId}`, review]));
      const lessonCountMap = new Map(lessonCounts.map((lc) => [lc._id.toString(), lc.lessonCount]));

      const enrolledStudents: IEnrolledStudent[] = enrollments.map((enrollment) => {
        const courseIdStr = enrollment.courseId._id.toString();
        const lessonCount = lessonCountMap.get(courseIdStr) || 1;
        const completedLessonsCount = enrollment.completedLessons?.length || 0;
        const progress = Math.round((completedLessonsCount / lessonCount) * 100);

        const reviewKey = `${enrollment.courseId._id}_${enrollment.studentId._id}`;
        const review = reviewMap.get(reviewKey);

        return {
          student: {
            _id: enrollment.studentId._id.toString(),
            name: enrollment.studentId.name || "Unknown Student",
            profilePicture: enrollment.studentId.profilePicture,
          },
          course: {
            _id: enrollment.courseId._id.toString(),
            courseTitle: enrollment.courseId.courseTitle,
          },
          review: review
            ? {
                rating: review.rating,
                comment: review.comment,
              }
            : undefined,
          progress,
        };
      });

      console.log(`Returning ${enrolledStudents.length} enrolled students`);
      return enrolledStudents;
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

export default new EnrollmentRepository