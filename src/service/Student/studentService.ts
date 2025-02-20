import { googleUserData, ILogin, IStudent, IStudentRepository, IStudentService } from "../../interface/IStudent.js";
import studentRepo from "../../repositories/student/studentRepo.js";
import { sendMail } from "../../utils/sendMail.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenUtils.js";
import { hashPassword } from "../../utils/passwordUtil.js";
import { JwtPayload } from "jsonwebtoken";




 class StudentService implements IStudentService{
    private studentRepo: IStudentRepository;


    constructor( studentRepo: IStudentRepository){
        this.studentRepo = studentRepo;
    }


    async registerStudent(studentData: Partial<IStudent> & { confirmPassword?: string }): Promise<IStudent | null> {
        try {
            if (!studentData.email) {
                throw new Error("Email is required");
            }

            if (!studentData.name) {
                throw new Error("Name is required");
            }
    
            const existingStudent = await this.studentRepo.findByEmail(studentData.email);
            if (existingStudent) {
                throw new Error("Student with this email already exists");
            }
    
            if (!studentData.password || !studentData.confirmPassword) {
                throw new Error("Password and Confirm Password are required");
            }
    
            if (studentData.password !== studentData.confirmPassword) {
                throw new Error("Passwords do not match");
            }
    
          
            const hashedPassword = await hashPassword(studentData.password);
    
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            console.log("Generated OTP:", otp); 
    
            const { confirmPassword,  ...studentDataWithoutConfirmPassword} = studentData; 
            const newStudentData = {
                ...studentDataWithoutConfirmPassword,
                password: hashedPassword, 
                otp,
                expiresAt,
                isVerified: false
            };
    
            const newStudent = await this.studentRepo.create(newStudentData);
    
            if (newStudent) {
                const emailMessage = `Your Otp code is ${otp}.It will expire 5 min`
                await sendMail(studentData.email, emailMessage);
            }
    
            return newStudent;
        } catch (error) {
            throw error;
        }
    }
    


    


    async generateOtp(email: string): Promise<string> {
        try {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
            await this.studentRepo.createOtp({ email, otp, expiresAt });
    
            await sendMail(email, otp);
            return otp;
        } catch (error) {
            throw error; 
        }
    }
    
    async verifyOtp(email: string, otp: string): Promise<IStudent | null> {
        try {
            const student = await this.studentRepo.findByEmailOtp(email)
            if(student && student.otp === otp && student.expiresAt > new Date()){
                student.isVerified = true;
                await student.save()
                return student
            }
            return null
        } catch (error) {
            throw error
        }
    }


    async resendOtp(email: string): Promise<IStudent | null> {
        try{
            const existingStudent = await this.studentRepo.findByEmail(email);
    
        if (!existingStudent) {
            throw new Error('Student not found');
        }
    
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
        await sendMail(email, otp);
    
        return await this.studentRepo.updateOtp(email, otp, expiresAt);

    }catch(error){
        throw error
    }
    }




    async login(email: string, password: string): Promise<ILogin> {
        const student = await this.studentRepo.findByEmail(email)
        if(!student){
            throw new Error('Invalid email ')
        }

        if (student.is_blocked) {
            const error = new Error('User is blocked by admin') as any;
            error.status = 403;
            throw error;
        }
        
        const isPasswordValid = await bcrypt.compare(password, student.password)
        if(!isPasswordValid){
            throw new Error('Invalid password')
        }

        const accessToken = generateAccessToken(student._id.toString());
        const refreshToken = generateRefreshToken(student._id.toString());
        

        return {
            accessToken,
            refreshToken,
            student: {
                _id: student._id,
                name: student.name,
                email: student.email,
            },
        }
    }


    async googlesignIn(
        studentData: googleUserData
      ): Promise<{ student: IStudent; accessToken: string; refreshToken: string }> {
        console.log("Google Sign-In: Checking for existing student with email:", studentData.email);
      
        const existingStudent = await this.studentRepo.findByEmail(studentData.email);
      
        if (existingStudent) {
          console.log("Google Sign-In: Existing student found, generating tokens");
      
          const accessToken = generateAccessToken(existingStudent._id.toString());
          const refreshToken = generateRefreshToken(existingStudent._id.toString());
      
          return { student: existingStudent, accessToken, refreshToken };
        }
      
        console.log("Google Sign-In: No existing student found, creating new student");
      
        const newStudent = await this.studentRepo.create({
          email: studentData.email,
          name: studentData.name || "Unknown",
          mobile: 0,
          googleId: studentData.uid, 
          isVerified: true,
          otp: "",
          expiresAt: new Date(),
          password: "",
        });
      
        if (!newStudent) {
            throw new Error("Failed to create new student");
          }
        
        console.log("Google Sign-In: New student created:", newStudent);
      
        const accessToken = generateAccessToken(newStudent._id.toString());
        const refreshToken = generateRefreshToken(newStudent._id.toString());
      
        return { student: newStudent, accessToken, refreshToken };
      }
      

      async getStudentProfile(studentId: string): Promise<IStudent | null> {
          const student = await this.studentRepo.getStudentProfile(studentId)
          if(!student){
            throw new Error('Profile not found')
          }
          return student
      }


      async updateStudentProfile(studentId: string, profileData: { name: string; email: string; phone: string; }): Promise<IStudent | null> {
          const updatestudent = await this.studentRepo.updateStudentProfile(studentId, profileData)
          if(!updatestudent){
            throw new Error('Failed to update profile')
          }
          return updatestudent
      }
      
    
}

export default new StudentService(studentRepo)