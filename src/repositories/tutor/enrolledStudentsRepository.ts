import { Types } from "mongoose";
import {
  IEnrolledStudent,
  IEnrollmentRepository,
} from "../../interface/IEnrollment.js";
import userModel from "../../models/studentModel.js";
import courseModel from "../../models/courseModel.js";
import reviewModel from "../../models/reviewModel.js";

class EnrollmentRepository implements IEnrollmentRepository {
  async findEnrolledStudents(
    tutorId: string,
    courseId?: string
  ): Promise<IEnrolledStudent[]> {
    try {
      if (!tutorId) {
        throw new Error("Tutor ID is required");
      }

      console.log(
        `Repository: Finding enrolled students for tutor: ${tutorId}, course: ${
          courseId || "all"
        } at ${new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}`
      );

      // Fetch courses for the tutor
      const tutorCourses = await courseModel
        .find({ tutorId: new Types.ObjectId(tutorId) })
        .select("_id regularPrice")
        .lean();

      const courseIds = tutorCourses.map((course) => course._id);

      if (courseIds.length === 0) {
        console.log("Repository: No courses found for this tutor");
        return [];
      }

      // Prepare query for enrolled students
      const enrollmentQuery = courseId
        ? { "enrollments.courseId": new Types.ObjectId(courseId) }
        : { "enrollments.courseId": { $in: courseIds } };

      console.log(
        `Repository: Querying students with:`,
        JSON.stringify(enrollmentQuery, null, 2)
      );

      // Fetch students with enrollments
      const students = await userModel
        .find(enrollmentQuery)
        .select("_id name email enrollments")
        .lean();

      console.log(`Repository: Found ${students.length} students`);

      if (students.length === 0) {
        console.log(
          "Repository: No enrolled students found for this tutor's courses"
        );
        return [];
      }

      const reviewQuery = courseId
        ? { courseId: new Types.ObjectId(courseId) }
        : { courseId: { $in: courseIds } };
      const reviews = await reviewModel
        .find(reviewQuery)
        .select("_id courseId userId rating comment createdAt updatedAt")
        .lean();

      console.log(`Repository: Found ${reviews.length} reviews`);

      const reviewMap = new Map<
        string,
        {
          rating: number;
          comment: string;
          createdAt?: string;
          updatedAt?: string;
        }[]
      >();
      reviews.forEach((review) => {
        const key = `${review.courseId.toString()}-${review.userId.toString()}`;
        if (!reviewMap.has(key)) {
          reviewMap.set(key, []);
        }
        reviewMap.get(key)!.push({
          rating: review.rating,
          comment: review.comment || "",
          createdAt: review.createdAt ? review.createdAt.toString() : undefined,
          updatedAt: review.updatedAt ? review.updatedAt.toString() : undefined,
        });
      });

      const enrolledStudents: IEnrolledStudent[] = [];
      const courseRevenueMap = new Map<string, number>();

      students.forEach((student: any) => {
        if (student.enrollments && Array.isArray(student.enrollments)) {
          student.enrollments.forEach((enrollment: any) => {
            const enrollmentCourseId = enrollment.courseId?.toString();
            const courseMatches = !courseId || enrollmentCourseId === courseId;

            if (
              courseMatches &&
              courseIds.some((id) => id.toString() === enrollmentCourseId)
            ) {
              const course = tutorCourses.find(
                (c) => c._id.toString() === enrollmentCourseId
              );
              const regularPrice = course?.regularPrice || 0;
              const revenuePerEnrollment = regularPrice; // Adjust based on your pricing model
              courseRevenueMap.set(
                enrollmentCourseId,
                (courseRevenueMap.get(enrollmentCourseId) || 0) +
                  revenuePerEnrollment
              );

              // Get reviews for this student and course
              const studentReviews =
                reviewMap.get(
                  `${enrollmentCourseId}-${student._id.toString()}`
                ) || [];
              const latestReview =
                studentReviews.length > 0 ? studentReviews[0] : null;

              enrolledStudents.push({
                id: student._id.toString(),
                name: student.name || "Unknown Student",
                courseId: enrollmentCourseId,
                enrolledDate: enrollment.enrolledAt
                  ? new Date(enrollment.enrolledAt).toISOString()
                  : new Date().toISOString(),
                progress:
                  typeof enrollment.progress === "number"
                    ? enrollment.progress
                    : 0,
                totalRevenue: revenuePerEnrollment,
                review: latestReview
                  ? {
                      _id: `review-${student._id}-${enrollmentCourseId}`,
                      courseId: enrollmentCourseId,
                      userId: student._id.toString(),
                      rating: latestReview.rating,
                      comment: latestReview.comment,
                      createdAt: latestReview.createdAt, // Already a string
                      updatedAt: latestReview.updatedAt, // Already a string
                    }
                  : undefined,
              });

              console.log(`Repository: Added enrolled student:`, {
                id: student._id.toString(),
                name: student.name,
                courseId: enrollmentCourseId,
                revenue: revenuePerEnrollment,
                hasReview: !!latestReview,
              });
            }
          });
        }
      });

      console.log(
        `Repository: Final result - Returning ${enrolledStudents.length} enrolled students`
      );
      return enrolledStudents;
    } catch (error: any) {
      console.error("Repository: Error in findEnrolledStudents:", error);
      throw new Error(
        `Failed to fetch enrolled students: ${error.message || error}`
      );
    }
  }
}

export default new EnrollmentRepository();
