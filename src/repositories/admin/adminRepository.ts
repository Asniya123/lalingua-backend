import { Types } from "mongoose";
import { IAdmin, IAdminRepository } from "../../interface/IAdmin.js";
import { IEnrolledStudent } from "../../interface/IEnrollment.js";
import adminModel from "../../models/adminModel.js";
import reviewModel from "../../models/reviewModel.js";
import courseModel from "../../models/courseModel.js";
import userModel from "../../models/studentModel.js";

class AdminRepository implements IAdminRepository {
  async findByEmail(email: string | undefined): Promise<IAdmin | null> {
    if (!email) throw new Error("Email is required");
    return adminModel.findOne({ email }).exec();
  }

  async findCourseEnrolledStudents(courseId: string): Promise<IEnrolledStudent[]> {
    try {
      if (!courseId) {
        throw new Error("Course ID is required");
      }

      console.log(
        `Repository: Finding enrolled students for course: ${courseId} at ${new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}`
      );

      // Fetch the course to get its regular price
      const course = await courseModel
        .findById(new Types.ObjectId(courseId))
        .select("_id regularPrice tutorId")
        .lean();

      if (!course) {
        console.log("Repository: Course not found");
        throw new Error("Course not found");
      }

      const regularPrice = course.regularPrice || 0;
      const adminRevenuePerEnrollment = regularPrice * 0.3; // Admin gets 30% of regular price

      // Query users with enrollments for this specific course
      const enrollmentQuery = { "enrollments.courseId": new Types.ObjectId(courseId) };

      console.log(
        `Repository: Querying students with:`,
        JSON.stringify(enrollmentQuery, null, 2)
      );

      const students = await userModel
        .find(enrollmentQuery)
        .select("_id name email enrollments")
        .lean();

      console.log(`Repository: Found ${students.length} students`);

      if (students.length === 0) {
        console.log("Repository: No enrolled students found for this course");
        return [];
      }

      // Fetch reviews for the course
      const reviews = await reviewModel
        .find({ courseId: new Types.ObjectId(courseId) })
        .select("_id courseId userId rating comment createdAt updatedAt")
        .lean();

      console.log(`Repository: Found ${reviews.length} reviews`);

      // Map reviews by student and course
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

      students.forEach((student: any) => {
        if (student.enrollments && Array.isArray(student.enrollments)) {
          student.enrollments.forEach((enrollment: any) => {
            const enrollmentCourseId = enrollment.courseId?.toString();
            if (enrollmentCourseId === courseId) {
              const studentReviews = reviewMap.get(`${enrollmentCourseId}-${student._id.toString()}`) || [];
              const latestReview = studentReviews.length > 0 ? studentReviews[0] : null;

              enrolledStudents.push({
                id: student._id.toString(),
                name: student.name || "Unknown Student",
                courseId: enrollmentCourseId,
                enrolledDate: enrollment.enrolledAt
                  ? new Date(enrollment.enrolledAt).toISOString()
                  : new Date().toISOString(),
                progress: typeof enrollment.progress === "number" ? enrollment.progress : 0,
                totalRevenue: adminRevenuePerEnrollment, // Admin's 30% share
                review: latestReview
                  ? {
                      _id: `review-${student._id}-${enrollmentCourseId}`,
                      courseId: enrollmentCourseId,
                      userId: student._id.toString(),
                      rating: latestReview.rating,
                      comment: latestReview.comment,
                      createdAt: latestReview.createdAt,
                      updatedAt: latestReview.updatedAt,
                    }
                  : undefined,
              });

              console.log(`Repository: Added enrolled student:`, {
                id: student._id.toString(),
                name: student.name,
                courseId: enrollmentCourseId,
                revenue: adminRevenuePerEnrollment,
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
      console.error("Repository: Error in findCourseEnrolledStudents:", error);
      throw new Error(
        `Failed to fetch enrolled students: ${error.message || error}`
      );
    }
  }

  async getTotalAdminRevenue(): Promise<number> {
    try {
      console.log(
        `Repository: Calculating total admin revenue at ${new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}`
      );

      // Fetch all courses to get their regular prices
      const courses = await courseModel
        .find()
        .select("_id regularPrice")
        .lean();

      if (courses.length === 0) {
        console.log("Repository: No courses found");
        return 0;
      }

      const courseIds = courses.map((course) => course._id);
      const coursePriceMap = new Map<string, number>();
      courses.forEach((course) => {
        coursePriceMap.set(course._id.toString(), course.regularPrice || 0);
      });

      // Query all users with enrollments
      const students = await userModel
        .find({ "enrollments.courseId": { $in: courseIds } })
        .select("enrollments")
        .lean();

      let totalAdminRevenue = 0;

      students.forEach((student: any) => {
        if (student.enrollments && Array.isArray(student.enrollments)) {
          student.enrollments.forEach((enrollment: any) => {
            const courseId = enrollment.courseId?.toString();
            const regularPrice = coursePriceMap.get(courseId) || 0;
            const adminRevenue = regularPrice * 0.3; // Admin's 30% share
            totalAdminRevenue += adminRevenue;
          });
        }
      });

      console.log(`Repository: Total admin revenue calculated: ${totalAdminRevenue}`);
      return totalAdminRevenue;
    } catch (error: any) {
      console.error("Repository: Error in getTotalAdminRevenue:", error);
      throw new Error(
        `Failed to calculate total admin revenue: ${error.message || error}`
      );
    }
  }

}

export default new AdminRepository();
