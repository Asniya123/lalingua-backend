import mongoose, { FilterQuery, Model } from "mongoose"
import { IEnrollment, IStudent, IStudentRepository } from "../../interface/IStudent"
import studentModel from "../../models/studentModel"



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

     async getUsers(page: number, limit: number, search?: string): Promise<{ users: IStudent[], total: number, totalStudents: number }> {
  try {
    const skip = (page - 1) * limit;
    const matchStage = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Execute all queries in parallel
    const [users, total, totalStudents] = await Promise.all([
      // Get paginated users
      studentModel.aggregate([
        { $match: matchStage },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            username: 1,
            name: 1,
            email: 1,
            mobile: 1,
            password: 1,
            otp: 1,
            expiresAt: 1,
            isVerified: 1,
            is_verified: 1, // Make sure this is included
            profilePicture: 1,
            dateOfBirth: 1,
            googleId: 1,
            is_blocked: 1,
            enrollments: 1,
            // Include all possible date fields
            createdAt: 1,
            updatedAt: 1,
            // Add these computed fields
            role: { $literal: 'Student' },
            status: { 
              $cond: { 
                if: '$is_blocked', 
                then: 'Inactive', 
                else: 'Active' 
              } 
            },
            // Try to get the creation date from multiple possible fields
            joinDate: {
              $cond: {
                if: { $ne: ['$createdAt', null] },
                then: '$createdAt',
                else: {
                  $cond: {
                    if: { $ne: ['$updatedAt', null] },
                    then: '$updatedAt',
                    else: new Date() // fallback to current date
                  }
                }
              }
            }
          },
        },
      ]),
      
      // Get total count of filtered results
      studentModel.countDocuments(matchStage),
      
      // Get total count of all students
      studentModel.countDocuments({}),
    ]);

    return {
      users: users || [],
      total: total || 0,
      totalStudents: totalStudents || 0,
    };
  } catch (error: any) {
    console.error('Error in StudentRepository.getUsers:', error);
    throw new Error('Failed to fetch users from database');
  }
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


    async getContact(query: FilterQuery<IStudent>, userId: string | undefined): Promise<IStudent[] | null> {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid or missing user ID:", userId);
      throw new Error("Valid user ID is required");
    }

    const completedQuery = {
      ...query,
      is_blocked: false,
      _id: { $ne: userId },
    };

    console.log(`Repository: Fetching contacts for userId: ${userId}, query:`, completedQuery);
    const users: IStudent[] | null = await studentModel.find(completedQuery, {
      _id: 1,
      username: 1,
      email: 1,
      profilePicture: 1,
    }).exec();

    if (!users || users.length === 0) {
      console.warn("No users found for query:", completedQuery);
      return null;
    }

    console.log("Contacts fetched:", JSON.stringify(users, null, 2));
    return users;
  }

  async update(studentId: string, data: Partial<IStudent> | { $pull: any }): Promise<IStudent | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        console.error("Invalid studentId:", studentId);
        throw new Error("Invalid student ID");
      }

      console.log(`Repository: Updating student with ID: ${studentId}, data:`, data);
      const updatedStudent = await studentModel
        .findByIdAndUpdate(studentId, data, { new: true, runValidators: true })
        .exec();

      if (!updatedStudent) {
        console.error(`Student not found: ${studentId}`);
        throw new Error(`Student not found: ${studentId}`);
      }

      console.log("Student updated:", JSON.stringify(updatedStudent, null, 2));
      return updatedStudent;
    } catch (error: any) {
      console.error(`Repository: Error updating student ${studentId}:`, {
        message: error.message,
        studentId,
        data,
        stack: error.stack,
      });
      throw new Error(`Failed to update student: ${error.message}`);
    }
  }
}

export default new StudentRepository()