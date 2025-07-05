import { IEnrollmentController, IEnrollmentService } from "../../interface/IEnrollment.js";
import { Request, Response } from 'express';


export default class EnrollmentController implements IEnrollmentController{
    private enrollmentService: IEnrollmentService

    constructor(enrollmentSevice: IEnrollmentService){
        this.enrollmentService = enrollmentSevice
    }
    
    async listEnrolledStudents(req: Request, res: Response): Promise<void> {
  try {
    const { tutorId, courseId } = req.query as { tutorId: string; courseId?: string };

    if (!tutorId) {
      console.error('Controller: Missing tutorId');
      res.status(400).json({
        success: false,
        message: 'Tutor ID is required',
        students: [],
      });
      return;
    }

    console.log(`Controller: Fetching students for tutor ${tutorId}, course ${courseId || 'all'}`);

    const result = await this.enrollmentService.listEnrolledStudents(tutorId, courseId);

    console.log(`Controller: Returning ${result.students.length} students`, JSON.stringify(result, null, 2));
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Controller: Error in listEnrolledStudents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch enrolled students',
      students: [],
    });
  }
}
}