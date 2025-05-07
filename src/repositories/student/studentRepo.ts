
import { FilterQuery } from "mongoose"
import { IEnrollment, IStudent, IStudentRepository } from "../../interface/IStudent.js"
import studentModel from "../../models/studentModel.js"
import { CustomError } from "../../domain/errors/customError.js"
import HttpStatusCode from "../../domain/enum/httpstatus.js"


class StudentRepository implements IStudentRepository{
   
    async create(data: Partial<IStudent>): Promise<IStudent | null >{
        try {
            return await studentModel.create(data)
        } catch (error) {
            console.error("Error creating student:", error)
            throw error
        }
    }


    async findByEmail(email: string): Promise<IStudent | null> {
        try {
        const student = await studentModel.findOne({ email })
        return student
        } catch (error) {
            console.error("Error finding student by email:", error)
            throw error
        }
    }


    async findById(id: string): Promise<IStudent | null> {
        try {
            return await studentModel.findById(id)
        } catch (error) {
            console.error("Error finding student by ID", error)
            throw error
        }
    }


    async findGoogleId(googleId: string): Promise<IStudent | null> {
        return await studentModel.findOne({google_id: googleId})
    }

    async createOtp(data: Partial<IStudent>): Promise<IStudent | null> {
        try {
            const { email, otp, expiresAt }=data
            return await studentModel.findOneAndUpdate({email},{otp,expiresAt})
        } catch (error) {
            throw  error
        }
    }

    async findByEmailOtp(email: string | undefined): Promise<IStudent | null> {
        try {
           const result = await studentModel.find({email}).sort({createdAt: -1}).limit(1)
           return result.length > 0 ? result[0] : null; 
        } catch (error) {
            throw error
        }
    }


    async updateOtp(email: string | undefined, otp: string, expiresAt: Date): Promise<IStudent | null> {
        try {
            return await studentModel.findOneAndUpdate({ email }, { otp, expiresAt })
        } catch (error) {
          
                throw error

            
        }
    }


    async updatePasswordAndClearOtp(email: string, password: string): Promise<IStudent | null> {
        return await studentModel.findOneAndUpdate(
            { email },
            { password, otp: null, expiresAt: null },
            {new: true }
        ).exec()
    }

    async getUsers(page: number, limit: number): Promise<{ users: IStudent[], total: number }> {
        const skip = (page - 1) * limit;
    
        const [users, total] = await Promise.all([
          studentModel.find().skip(skip).limit(limit).lean(),
          studentModel.countDocuments(),
        ]);
    
        return { users, total };
      }


    async getStudentProfile(studentId: string): Promise<IStudent | null> {
        return await studentModel.findById(studentId)
    }

    async updateStudentProfile(studentId: string, profileData: Partial<IStudent>): Promise<IStudent | null> {
        const { name, email, mobile } = profileData;
    
        return await studentModel.findByIdAndUpdate(
            studentId,
            { name, email, mobile }, 
            { new: true, runValidators: true } 
        );
    }
    

    async uploadProfilePicture(studentId: string, profilePicture: string): Promise<IStudent | null> {
        return await studentModel.findByIdAndUpdate(studentId, {profilePicture},
            {new: true, runValidators: true}
        )
    }


    async changePassword(studentId: string, newPassword: string): Promise<IStudent | null> {
        const student = await studentModel.findOneAndUpdate(
            { _id: studentId },
            { password: newPassword },
            { new: true }
        );
    
        return student;
    }


    async updateEnrollments(studentId: string, enrollmentData: IEnrollment): Promise<IStudent | null> {
        try {
          return await studentModel.findByIdAndUpdate(
            studentId,
            { $push: { enrollments: enrollmentData } },
            { new: true }
          ).exec();
        } catch (error) {
          console.error(`Error updating enrollments for student ${studentId}:`, error);
          throw new Error("Failed to update enrollments");
        }
    }


    async  getContact(query: FilterQuery<IStudent>, userId: string | undefined): Promise<IStudent[] | null> {
        try {
            const completedQuery = {
                ...query,
                is_blocked: false,
                _id: { $ne: userId },
            }

            const users: IStudent[] | null = await studentModel.find(completedQuery, {
                _id: 1,
                username: 1,
                email: 1,
                profilePicture: 1
            })

            if(!users){
                throw new CustomError('No users found', HttpStatusCode.NOT_FOUND)
            }
            return users
        } catch (error) {
            throw error
        }
    }

    async update(studentId: string, data: Partial<IStudent> | { $pull: any }): Promise<IStudent | null> {
        try {
          return await studentModel.findByIdAndUpdate(
            studentId,
            data,
            { new: true, runValidators: true }
          ).exec();
        } catch (error) {
          console.error(`Error updating student ${studentId}:`, error);
          throw new CustomError("Failed to update student", HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
      }
}

export default new StudentRepository()