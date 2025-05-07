import { googleTutorData, IEnrolledStudent, ILogin, ITutor, ITutorRepository, ITutorService } from "../../interface/ITutor.js";
import tutorRepo from "../../repositories/tutor/tutorRepo.js";
import { sendMail } from "../../utils/sendMail.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenUtils.js";
import { comparePassword, hashPassword } from "../../utils/passwordUtil.js";
import bcrypt from "bcrypt";

class TutorService implements ITutorService {
    private tutorRepo: ITutorRepository;
    enrollmentRepository: any;

    constructor(tutorRepo: ITutorRepository){
        this.tutorRepo = tutorRepo;
    }

    async registerTutor(tutorData: Partial<ITutor> & { confirmPassword?: string }): Promise<ITutor | null> {
        try {
            if(!tutorData.email){
                throw new Error("Email is required");
            }
            if (!tutorData.name) {
                throw new Error("Name is required");
            }

            const existingTutor = await this.tutorRepo.findByEmail(tutorData.email);
            if(existingTutor){
                throw new Error('Tutor with this email already exists');
            }

            if (!tutorData.password || !tutorData.confirmPassword) {
                throw new Error("Password and Confirm Password are required");
            }
    
            if (tutorData.password !== tutorData.confirmPassword) {
                throw new Error("Passwords do not match");
            }

            const hashedPassword = await hashPassword(tutorData.password);
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            const newTutorData = {
                ...tutorData,
                password: hashedPassword,
                otp,
                expiresAt,
                isVerified: false,
                document: tutorData.documents
            };

            const newTutor = await this.tutorRepo.create(newTutorData);
            if(!newTutor){
                throw new Error("Tutor registration failed");
            }
            const emailMessage = `Your OTP code is ${otp}. It will expire in 5 minutes`;
            await sendMail(tutorData.email, emailMessage);
            return newTutor;
        } catch (error) {
            throw error;
        }
    }

    async generateOtp(email: string): Promise<string>{
        try {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            console.log(" OTP:", otp); 
            await this.tutorRepo.createOtp({email, otp, expiresAt});
            await sendMail(email, otp);
            return otp;
        } catch (error) {
            throw error;
        }
    }

    async verifyOtp(email: string, otp: string): Promise<ITutor | null> {
        try {
            const tutor = await this.tutorRepo.findByEmailOtp(email);
            if (tutor && tutor.otp === otp && tutor.expiresAt > new Date()) {
                tutor.isVerified = true;
                await tutor.save();
                return tutor;
            }
            return null;
        } catch (error) {
            console.error("Error in OTP verification:", error);
            throw error;
        }
    }

    async resendOtp(email: string): Promise<ITutor | null> {
        try {
            const existingTutor = await this.tutorRepo.findByEmail(email);
            if(!existingTutor){
                throw new Error('Tutor not found');
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            console.log("Resend OTP:", otp); 
            await sendMail(email, otp);
            return await this.tutorRepo.updateOtp(email, otp, expiresAt);
        } catch (error) {
            throw error;
        }
    }

    async googlesignIn(tutorData: googleTutorData): Promise<{ tutor: ITutor; accessToken: string; refreshToken: string }> {
        const existingTutor = await this.tutorRepo.findByEmail(tutorData.email);

        if(existingTutor){
            const accessToken = generateAccessToken(existingTutor._id.toString());
            const refreshToken = generateRefreshToken(existingTutor._id.toString());
            return {tutor: existingTutor, accessToken, refreshToken};
        }

        const newTutor = await this.tutorRepo.create({
            email: tutorData.email,
            name: tutorData.name || "Unknown",
            mobile: 0,
            googleId: tutorData.uid,
            isVerified: true,
            otp: "",
            expiresAt: new Date(),
            password: "",
        });

        if(!newTutor){
            throw new Error('Failed to create new tutor');
        }

        const accessToken = generateAccessToken(newTutor._id.toString());
        const refreshToken = generateRefreshToken(newTutor._id.toString());
        return {tutor: newTutor, accessToken, refreshToken};
    }

    async login(email: string, password: string): Promise<ILogin> {       
        const tutor = await this.tutorRepo.findByEmail(email);
        if(!tutor){
            throw new Error('Invalid Email');
        }

        if (tutor.is_blocked) {
            throw new Error('Your account has been blocked. Contact support.');
        }

        const isPasswordValid = await comparePassword(password, tutor.password);
        if(!isPasswordValid){
            throw new Error('Invalid Password');
        }

        const accessToken = generateAccessToken(tutor._id.toString());
        const refreshToken = generateRefreshToken(tutor._id.toString());
        return {
            accessToken,
            refreshToken,
            tutor: {
                _id: tutor._id,
                name: tutor.name,
                email: tutor.email,
                status: tutor.status,
                is_blocked: tutor.is_blocked,
                mobile: tutor.mobile,
                profilePicture: tutor.profilePicture
            }
        };
    }

    async verifyTutor(tutorId: string): Promise<ITutor | null> {
        try {
            const tutor = await this.tutorRepo.findById(tutorId);
            if (!tutor) {
                return null;
            }
            return tutor;
        } catch (error) {
            console.error("Error verifying tutor:", error);
            throw error;
        }
    }

    async renewAccessToken(tutorId: string): Promise<string> {
        try {
            const tutor = await this.tutorRepo.findById(tutorId);
            if (!tutor) {
                throw new Error("Tutor not found");
            }
            return generateAccessToken(tutor._id.toString());
        } catch (error) {
            console.error("Error renewing access token:", error);
            throw error;
        }
    }

    async getTutorProfile(tutorId: string): Promise<ITutor | null> {
        const tutor = await this.tutorRepo.getTutorProfile(tutorId);
        if(!tutor){
            throw new Error('Profile not found');
        }
        return tutor;
    }

    async updateTutorProfile(tutorId: string, profileData: Partial<ITutor>): Promise<ITutor | null> {
        const updatedTutor = await this.tutorRepo.updateTutorProfile(tutorId, profileData);
        if (!updatedTutor) {
            throw new Error('Failed to update profile');
        }
        return updatedTutor;
    }

    async uploadProfilePicture(tutorId: string, profilePicture: string): Promise<ITutor | null> {
        const updatedTutor = await this.tutorRepo.uploadProfilePicture(tutorId, profilePicture);
        if(!updatedTutor){
            throw new Error('Failed to update profile picture');
        }
        return updatedTutor;
    }

    async forgotPassword(email: string): Promise<void> {
        try {
            const tutor = await this.tutorRepo.findByEmail(email);
            if(!tutor){
                throw new Error('No tutor found with this email');
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            console.log("Forgot OTP:", otp); 
            await this.tutorRepo.updateOtp(email, otp, expiresAt);
            
            const emailMessage = `Your OTP code for password reset is ${otp}. It will expire in 5 minutes`;
            await sendMail(email, emailMessage);
        } catch (error) {
            throw error;
        }
    }

    async resetPassword(email: string, otp: string, newPassword: string): Promise<ITutor> {
        try {
            const tutor = await this.tutorRepo.findByEmail(email);
            if(!tutor){
                throw new Error('Tutor not found');
            }

            if(!tutor.otp || tutor.otp !== otp){
                throw new Error('Invalid OTP');
            }

            if(tutor.expiresAt < new Date()){
                throw new Error('OTP has expired');
            }

            const hashedPassword = await hashPassword(newPassword);
            const updatedTutor = await this.tutorRepo.updatePasswordAndClearOtp(email, hashedPassword);

            if(!updatedTutor){
                throw new Error('Failed to reset password');
            }

            return updatedTutor;
        } catch (error) {
            console.error('Reset Password Error:', error);
            throw error;
        }
    }

    async changePassword(tutorId: string, currentPassword: string, newPassword: string): Promise<ITutor | null> {
        const tutor = await this.tutorRepo.findById(tutorId);
        if(!tutor){
            throw new Error('Invalid User');
        }

        const isPasswordCorrect = await bcrypt.compare(currentPassword, tutor.password);
        if(!isPasswordCorrect){
            throw new Error('Invalid password');
        }

        const hashedPassword = await hashPassword(newPassword);
        const updatePassword = await this.tutorRepo.changePassword(tutorId, hashedPassword);
        if(!updatePassword){
            throw new Error("Couldn't update password");
        }
        return updatePassword;
    }


    async getEnrolledStudents(tutorId: string, requestingTutorId: string): Promise<{
        success: boolean;
        message: string;
        enrolledStudents: IEnrolledStudent[];
        total: number;
      }> {
        if (tutorId !== requestingTutorId) {
            throw new Error('Unauthorized: You can only view your own enrolled students');
        }
        
        try {
          const enrolledStudents = await this.enrollmentRepository.getEnrolledStudentsByTutor(tutorId);
        return {
        success: true,
        message: 'Enrolled students retrieved successfully',
        enrolledStudents,
        total: enrolledStudents.length,
      };
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch enrolled students');
        }
    }
}

export default new TutorService(tutorRepo);