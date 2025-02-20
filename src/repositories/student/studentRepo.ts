
import { IStudent, IStudentRepository } from "../../interface/IStudent.js"
import studentModel from "../../models/studentModel.js"

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


    async updatePassword(email: string, password: string): Promise<IStudent | null> {
        return await studentModel.findOneAndUpdate(
            { email },
            { password }
            
        )
    }

    async getUsers(): Promise<IStudent[]> {
        return await studentModel.find()
        }


    async getStudentProfile(studentId: string): Promise<IStudent | null> {
        return await studentModel.findById(studentId)
    }

    async updateStudentProfile(studentId: string, profileData: any): Promise<IStudent | null> {
        return await studentModel.findByIdAndUpdate(studentId, profileData)
    }
    
}

export default new StudentRepository()