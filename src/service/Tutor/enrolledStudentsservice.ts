import {
  
  ICourseWithEnrollments,
 
  IEnrolledStudentsResponse,
 
  IEnrollmentRepository,
  IEnrollmentService,
} from "../../interface/IEnrollment.js";

import enrolledStudents from "../../repositories/tutor/enrolledStudentsRepository.js";

class EnrollmentService implements IEnrollmentService {
  private enrollmentRepository: IEnrollmentRepository;

  constructor(enrollmentRepository: IEnrollmentRepository) {
    this.enrollmentRepository = enrollmentRepository;
  }

  async listEnrolledStudents(tutorId: string, courseId?: string): Promise<IEnrolledStudentsResponse> {
  try {
    if (!tutorId) {
      throw new Error('Tutor ID is required');
    }

    console.log(`Service: Fetching enrolled students for tutor: ${tutorId}, course: ${courseId || 'all'}`);

    const students = await this.enrollmentRepository.findEnrolledStudents(tutorId, courseId);

    console.log(`Service: Found ${students.length} enrolled students`, JSON.stringify(students, null, 2));
    return {
      success: true,
      message: `Successfully retrieved ${students.length} enrolled students`,
      students,
    };
  } catch (error: any) {
    console.error('Service: Error in listEnrolledStudents:', error);
    throw new Error(error.message || 'Failed to fetch enrolled students');
  }
}

}

export default new EnrollmentService(enrolledStudents);
