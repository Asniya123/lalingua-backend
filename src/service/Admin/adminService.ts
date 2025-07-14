import { ILogin, IAdminRepository, IAdminService, IAdmin } from "../../interface/IAdmin.js";
import adminRepository from "../../repositories/admin/adminRepository.js";
import studentRepository from "../../repositories/student/studentRepo.js"
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenUtils.js";
import { IStudentRepository } from "../../interface/IStudent.js";
import tutorRepository from "../../repositories/tutor/tutorRepo.js";
import { ITutor, ITutorRepository } from "../../interface/ITutor.js";
import { sendMail } from "../../utils/sendMail.js";
import { ICourse, ICourseRepository } from "../../interface/ICourse.js";
import courseRepo from "../../repositories/tutor/courseRepo.js";
import { IEnrolledStudentsResponse } from "../../interface/IEnrollment.js";

class AdminService implements IAdminService {
  private adminRepository: IAdminRepository;
  private studentRepository: IStudentRepository;
  private tutorRepository: ITutorRepository;
  private courseRepository: ICourseRepository
  
 

  constructor(adminRepository: IAdminRepository, studentRepository: IStudentRepository,tutorRepository:ITutorRepository,courseRepository: ICourseRepository) {
    this.adminRepository = adminRepository;
    this.studentRepository = studentRepository;
    this.tutorRepository = tutorRepository
    this.courseRepository = courseRepository
  }

  async login(email: string, password: string): Promise<ILogin> {
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) {
      throw new Error("Admin not found");
    }

    const isPasswordValid = password === admin.password
   

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const accessToken = generateAccessToken(admin._id.toString());
    const refreshToken = generateRefreshToken(admin._id.toString());

    return {
      adminId: admin._id.toString(),
      accessToken,
      refreshToken,
    };
  }

  async getUsers(page: number, limit: number, search?: string ): Promise<{ users: IAdmin[], total: number, totalStudents: number}> {
    try {
      const data = await this.studentRepository.getUsers(page, limit, search);
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Service error: ${errorMessage}`);
    }
  }


  async blockUnblock(userId: string, isBlocked: boolean): Promise<any> {
    try {
      const user = await this.studentRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
  
      user.is_blocked = isBlocked;
      await user.save();
      return user;
    } catch (error: any) {
      console.error('Error in blockUnblock:', error);
      throw new Error(`Failed to block/unblock user: ${error.message}`);
    }
  }
  

  async getTutors(page: number, limit: number, query: any = { status: 'approved' }, search?: string ): Promise<{ tutor: IAdmin[], total: number, totalApprovedTutors: number }> {
    try {
      return await this.tutorRepository.getTutors(page, limit, query, search);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Service error: ${errorMessage}`);
    }
  }

  async tutorManagement(tutorId: string, isBlocked: boolean): Promise<any> {
      try {
        const tutor = await this.tutorRepository.findById(tutorId);
        if (!tutor) {
          throw new Error("User not found");
        }
  
        tutor.is_blocked = isBlocked;
        await tutor.save();
        return tutor;
      } catch (error: any) {
        throw new Error(error.message);
      }
  }

  
async getAllTutors(search?: string): Promise<IAdmin[]> {
    try {
        return await this.tutorRepository.getAllTutors(search);
    } catch (error) {
        console.error("Error in getAllTutors service:", error);
        throw error;
    }
}

  async updateTutorStatus(tutorId: string, status: "approved" | "rejected", reason?: string): Promise<{ success: boolean; message: string; }> {
      const tutor = await this.tutorRepository.findById(tutorId)

      if(!tutor){
        throw new Error('Tutor not found')
      }

      tutor.status = status
      await tutor.save()

      if(status === 'rejected' && reason){
        await sendMail(tutor.email, `Dear ${tutor.name}, \n\nYour tutor registration has been rejected. \nReason: ${reason}\n\nBest regards, \nAdmin Team`)
      }

      return {
        success: true,
        message: `Tutor status updated to ${status}`
      }
  }

  async getCourse(page: number, limit: number, search?: string ): Promise<{ courses: ICourse[]; total: number }> {
    try {
        return await this.courseRepository.getCourse(page, limit, search);
    } catch (error) {
        console.error('Error in CourseService.getCourse:', error);
        throw new Error('Service failed to fetch courses');
    }
}

  async blockedUnblocked(courseId: string, isBlocked: boolean): Promise<ICourse> {
    try {
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new Error("Course not found");
        }

      
        return await this.courseRepository.updateBlockStatus(courseId, isBlocked);
    } catch (error: any) {
        console.error('Error in blockedUnblocked:', error);
        throw new Error(`Failed to block/unblock course: ${error.message}`);
    }
}

async listCourseEnrolledStudents(courseId: string): Promise<IEnrolledStudentsResponse> {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }

      console.log(`Service: Fetching enrolled students for course: ${courseId}`);

      const students = await this.adminRepository.findCourseEnrolledStudents(courseId);

      console.log(`Service: Found ${students.length} enrolled students`, JSON.stringify(students, null, 2));
      return {
        success: true,
        message: `Successfully retrieved ${students.length} enrolled students`,
        students,
      };
    } catch (error: any) {
      console.error('Service: Error in listCourseEnrolledStudents:', error);
      throw new Error(error.message || 'Failed to fetch enrolled students');
    }
  }

  async getTotalAdminRevenue(): Promise<number> {
    try {
      console.log(`Service: Fetching total admin revenue`);
      const totalRevenue = await this.adminRepository.getTotalAdminRevenue();
      console.log(`Service: Total admin revenue: ${totalRevenue}`);
      return totalRevenue;
    } catch (error: any) {
      console.error('Service: Error in getTotalAdminRevenue:', error);
      throw new Error(error.message || 'Failed to fetch total admin revenue');
    }
  }

}

export default new AdminService(adminRepository, studentRepository, tutorRepository, courseRepo);
