// import {IEnrollmentRepository, IEnrollmentService } from "../../interface/IEnrollment.js";
// import enrollmentRepository from "../../repositories/student/enrollmentRepository.js";



// export class EnrollmentService implements IEnrollmentService{
//     private enrollmentRepository: IEnrollmentRepository 

//     constructor(
//         enrollmentRepository: IEnrollmentRepository
//     ){
//         this.enrollmentRepository = enrollmentRepository
//     }

//     async getEnrolledCourses(userId: string): Promise<IEnrolledCourse[]> {
//         try {
//           return await this.enrollmentRepository.getEnrolledCourses(userId);
//         } catch (error: Error) {
//           throw new Error(`Service error: ${error.message}`);
//         }
//     }
    
// }

// export default new EnrollmentService(enrollmentRepository)