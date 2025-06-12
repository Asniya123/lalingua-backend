// import { Request, Response } from "express";
// import { IEnrollmentController, IEnrollmentService } from "../../interface/IEnrollment.js";
export {};
// export default class EnrollmentController implements IEnrollmentController{
//     private enrollmentService : IEnrollmentService
//     constructor(erollmentService: IEnrollmentService){
//         this.enrollmentService = erollmentService
//     }
//     async getEnrolledCourses(req: Request, res: Response): Promise<void> {
//       try {
//         const userId = req.params.userId;
//         const courses = await this.enrollmentService.getEnrolledCourses(userId);
//         res.status(200).json({ success: true, courses });
//       } catch (error: Error) {
//         res.status(500).json({ success: false, message: error.message });
//       }
//     }
// }
