import { ITutor, ITutorRepository } from "../../interface/ITutor.js";
import tutorModel from "../../models/tutorModel.js";


class TutorRepository implements ITutorRepository{
    async create(data: Partial<ITutor>): Promise<ITutor | null> {
        try {
            return await tutorModel.create(data)
        } catch (error) {
            console.error('Error creating tutor:', error)
            throw error
        }
    }

    async findByEmail(email: string): Promise<ITutor | null > {
        try {
            return await tutorModel.findOne({ email })
        } catch (error) {
            console.error('Error finding tutor by email:', error)
            throw error
        }
    }


    async findById(id: string): Promise<ITutor | null > {
        try {
            return await tutorModel.findById(id)
        } catch (error) {
            console.error('Error finding tutor ID', error)
            throw error
        }
    }

    async createOtp(data: Partial<ITutor>): Promise<ITutor | null> {
        try {
            const { email, otp, expiresAt }=data
            return await tutorModel.findOneAndUpdate({email},{otp,expiresAt})
        } catch (error) {
            throw error
        }
    }

    async findByEmailOtp(email: string | undefined): Promise<ITutor | null> {
        try {
            const result = await tutorModel.find({ email }).sort({createdAt: -1}).limit(1)
            return result.length > 0 ? result[0] : null
        } catch (error) {
            throw error
        }
    }


    async updateOtp(email: string, otp: string, expiresAt: Date): Promise<ITutor | null> {
        try {
            return await tutorModel.findOneAndUpdate({ email }, { otp, expiresAt}, {new: true, upsert: true})
        } catch (error) {
            throw error
        }
    }

    async findGoogleId(googleId: string): Promise<ITutor | null> {
        return await tutorModel.findOne({google_id: googleId})
    }

    async getTutors(): Promise<ITutor[]> {
        return await tutorModel.find()
    }

    async getAllTutors(): Promise<ITutor[]> {
        return await tutorModel.find()
    }
}

export default new TutorRepository()