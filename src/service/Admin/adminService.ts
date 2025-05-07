import { ILogin, IAdminRepository, IAdminService, IAdmin } from "../../interface/IAdmin.js";
import adminRepository from "../../repositories/admin/adminRepository.js";
import studentRepository from "../../repositories/student/studentRepo.js"
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenUtils.js";
import { IStudentRepository } from "../../interface/IStudent.js";
import tutorRepository from "../../repositories/tutor/tutorRepo.js";
import { ITutor, ITutorRepository } from "../../interface/ITutor.js";
import { sendMail } from "../../utils/sendMail.js";
import { ICourse, ICourseRepository } from "../../interface/ICourse.js";
import courseRepo from "../../repositories/tutor/courseRepo.js";

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

    console.log("Admin password hash from DB:", admin.password); 

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

  async getUsers(page: number, limit: number): Promise<{ users: IAdmin[], total: number }> {
    return await this.studentRepository.getUsers(page, limit);
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
  

  async getTutors(page: number, limit: number, query: any = { status: 'approved' }): Promise<{tutor: ITutor[], total: number}> {
    return await this.tutorRepository.getTutors(page, limit, query);
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

  async getAllTutors(): Promise<IAdmin[]> {
      return await this.tutorRepository.getAllTutors()
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

  async getCourse(page: number, limit: number): Promise<{ courses: ICourse[]; total: number }> {
    return await this.courseRepository.getCourse(page, limit);
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

}

export default new AdminService(adminRepository, studentRepository, tutorRepository, courseRepo);
