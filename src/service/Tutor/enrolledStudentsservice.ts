import { IEnrolledStudent, IEnrollmentRepository, IEnrollmentService } from "../../interface/IEnrollment.js";
import enrolledStudents from "../../repositories/tutor/enrolledStudentsRepository.js";

class EnrollmentService implements IEnrollmentService{
    private enrollmentRepository: IEnrollmentRepository

    constructor(enrollmentRepository: IEnrollmentRepository){
        this.enrollmentRepository = enrollmentRepository
    }

     async getEnrolledStudentsByTutor(tutorId: string): Promise<IEnrolledStudent[]> {
    try {
      console.log(`Service: Fetching enrolled students for tutorId: ${tutorId}`);
      const students = await this.enrollmentRepository.getEnrolledStudentsByTutor(tutorId);
      console.log(`Service: Returned ${students.length} enrolled students`);
      return students;
    } catch (error) {
      console.error("Service error:", error);
      throw error;
    }
  }
}

export default new EnrollmentService(enrolledStudents)