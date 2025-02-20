import { googleTutorData, ILogin, ITutor, ITutorRepository, ITutorService } from "../../interface/ITutor.js";
import tutorRepo from "../../repositories/tutor/tutorRepo.js";
import { sendMail } from "../../utils/sendMail.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenUtils.js";
import { hashPassword } from "../../utils/passwordUtil.js";

class TutorService implements ITutorService{
    private tutorRepo: ITutorRepository;

    constructor(tutorRepo: ITutorRepository){
        this.tutorRepo = tutorRepo
    }


    async registerTutor(tutorData: Partial<ITutor> & { confirmPassword?: string }): Promise<ITutor | null> {
        try {
            if(!tutorData.email){
                throw new Error("Email is required")
            }
            if (!tutorData.name) {
                throw new Error("Name is required");
            }

            const existingTutor =  await this.tutorRepo.findByEmail(tutorData.email)
            if(existingTutor){
                throw new Error('Tutor with this email already exists')
            }

            if (!tutorData.password || !tutorData.confirmPassword) {
                throw new Error("Password and Confirm Password are required");
            }
    
            if (tutorData.password !== tutorData.confirmPassword) {
                throw new Error("Passwords do not match");
            }

            const hashedPassword = await hashPassword(tutorData.password);

            const otp = Math.floor(100000 + Math.random() * 900000).toString()
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    
            console.log("Generated OTP:", otp); 
            

            const newTutorData = {
                ...tutorData,
                otp,
                expiresAt,
                isVerified: false,
                document: tutorData.documents
            }

            const newTutor = await this.tutorRepo.create(newTutorData)
            if(!newTutor){
                throw new Error("Tutor registration failed")
            }
            const emailMessage = `Your Otp code is ${otp}.It will expire 5 min`
            await sendMail(tutorData.email, emailMessage);
            return newTutor
        } catch (error) {
            throw error
        }
    }


    async generateOtp(email: string): Promise<string>{
        try {
            const otp = Math.floor(100000 + Math.random() * 900000).toString()
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

            await this.tutorRepo.createOtp({email, otp, expiresAt})

            await sendMail(email, otp)
            return otp
        } catch (error) {
            throw error
        }
    }

    async verifyOtp(email: string, otp: string): Promise<ITutor | null >{
        try {
            console.log("Verifying OTP for email:", email, "OTP:", otp); 
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
            const existingTutor = await this.tutorRepo.findByEmail(email)

            if(!existingTutor){
                throw new Error('Tutor not  found')
            }

            const otp = Math.floor(100000 + Math.random()  * 900000).toString()
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

            await sendMail(email, otp)

            return await this.tutorRepo.updateOtp(email, otp, expiresAt)
        } catch (error) {
            throw error
        }
    }

    async googlesignIn(tutorData: googleTutorData): Promise<{ tutor: ITutor; accessToken: string; refreshToken: string; }> {
        const existingTutor = await this.tutorRepo.findByEmail(tutorData.email)

        if(existingTutor){
            const accessToken = generateAccessToken(existingTutor._id.toString())
            const refreshToken = generateRefreshToken(existingTutor._id.toString())

            return {tutor: existingTutor, accessToken, refreshToken}
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
        })

        if(!newTutor){
            throw new Error('Failed to create new tutor')
        }

        const accessToken = generateAccessToken(newTutor._id.toString())
        const refreshToken = generateRefreshToken(newTutor._id.toString())

        return {tutor: newTutor, accessToken, refreshToken}
    }


    async login(email: string, password: string): Promise<ILogin> {        
        const tutor = await this.tutorRepo.findByEmail(email)
        if(!tutor){
            throw new Error('Invalid Email')
        }

        
        if (tutor.is_blocked) {
            throw new Error('Your account has been blocked. Contact support.');
        }

        const isPasswordValid = password==tutor.password
        if(!isPasswordValid){
            throw new Error('Invalid Password')
        }

        const accessToken = generateAccessToken(tutor._id.toString())
        const refreshToken = generateRefreshToken(tutor._id.toString())
        return{
            accessToken,
            refreshToken,
            tutor: {
                _id: tutor._id,
                name: tutor.name,
                email: tutor.email,
                status: tutor.status, 
                is_blocked:tutor.is_blocked,

            }
        }
    }
}

export default new TutorService(tutorRepo)