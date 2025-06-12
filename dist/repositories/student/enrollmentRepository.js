// import { IEnrolledCourse, IEnrollment, IEnrollmentRepository } from "../../interface/IEnrollment.js";
// import studentModel from "../../models/studentModel.js";
export {};
// class EnrollmentRepository implements IEnrollmentRepository{
//     async getEnrolledCourses(userId: string): Promise<IEnrolledCourse[]> {
//         try {
//             const user = await studentModel.findById(userId).populate({
//               path: "enrollments.courseId",
//               populate: [
//                 { path: "tutorId", select: "name profilePicture" },
//                 { path: "category", select: "name" },
//                 { path: "language", select: "name" },
//               ],
//             });
//             if (!user) {
//               throw new Error("User not found");
//             }
//             const enrolledCourses: IEnrolledCourse[] = user.enrollments.map((enrollment) => {
//               const course = enrollment.courseId as any;
//               return {
//                 _id: course._id,
//                 courseTitle: course.courseTitle,
//                 imageUrl: course.imageUrl,
//                 category: course.category,
//                 language: course.language,
//                 tutorId: course.tutorId,
//                 description: course.description,
//                 regularPrice: course.regularPrice,
//                 buyCount: course.buyCount,
//                 isBlock: course.isBlock,
//                 lessons: course.lessons,
//                 createdAt: course.createdAt,
//                 updatedAt: course.updatedAt,
//                 tutor: course.tutorId,
//                 paymentId: enrollment.paymentId,
//                 orderId: enrollment.orderId,
//                 amount: enrollment.amount,
//                 currency: enrollment.currency || "INR",
//                 enrolledAt: enrollment.enrolledAt,
//                 status: enrollment.status,
//               };
//             });
//             return enrolledCourses;
//           } catch (error: unknown) {
//             if (error instanceof Error) {
//               throw new Error(`Failed to fetch enrolled courses: ${error.message}`);
//             } else {
//               throw new Error("Unknown error occurred while fetching enrolled courses.");
//             }
//         }
//     }
// }
// export default new EnrollmentRepository()
