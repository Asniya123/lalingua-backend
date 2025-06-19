import { IEnrolledStudent, IEnrollmentController, IEnrollmentService } from "../../interface/IEnrollment.js";
import { Request, Response } from 'express';

export default class EnrollmentController implements IEnrollmentController{
    private enrollmentService: IEnrollmentService

    constructor(enrollmentSevice: IEnrollmentService){
        this.enrollmentService = enrollmentSevice
    }

    async getEnrolledStudentsByTutor(req: Request, res: Response): Promise<void> {
    try {
      const tutorId = req.tutor!._id; 
      console.log(`Controller: Received request for tutorId: ${tutorId}`);
      const enrolledStudents: IEnrolledStudent[] = await this.enrollmentService.getEnrolledStudentsByTutor(tutorId);
      console.log(`Controller: Returning ${enrolledStudents.length} enrolled students`);
      res.status(200).json({
        success: true,
        enrolledStudents,
        total: enrolledStudents.length,
      });
    } catch (error) {
      console.error("Controller error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error fetching enrolled students",
      });
    }
  }
}