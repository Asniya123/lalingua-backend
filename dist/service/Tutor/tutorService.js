var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import tutorRepo from "../../repositories/tutor/tutorRepo.js";
import { sendMail } from "../../utils/sendMail.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenUtils.js";
import { comparePassword, hashPassword } from "../../utils/passwordUtil.js";
import bcrypt from "bcrypt";
class TutorService {
    constructor(tutorRepo) {
        this.tutorRepo = tutorRepo;
    }
    registerTutor(tutorData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!tutorData.email) {
                    throw new Error("Email is required");
                }
                if (!tutorData.name) {
                    throw new Error("Name is required");
                }
                const existingTutor = yield this.tutorRepo.findByEmail(tutorData.email);
                if (existingTutor) {
                    throw new Error('Tutor with this email already exists');
                }
                if (!tutorData.password || !tutorData.confirmPassword) {
                    throw new Error("Password and Confirm Password are required");
                }
                if (tutorData.password !== tutorData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const hashedPassword = yield hashPassword(tutorData.password);
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                const newTutorData = Object.assign(Object.assign({}, tutorData), { password: hashedPassword, otp,
                    expiresAt, isVerified: false, document: tutorData.documents });
                const newTutor = yield this.tutorRepo.create(newTutorData);
                if (!newTutor) {
                    throw new Error("Tutor registration failed");
                }
                const emailMessage = `Your OTP code is ${otp}. It will expire in 5 minutes`;
                yield sendMail(tutorData.email, emailMessage);
                return newTutor;
            }
            catch (error) {
                throw error;
            }
        });
    }
    generateOtp(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                console.log(" OTP:", otp);
                yield this.tutorRepo.createOtp({ email, otp, expiresAt });
                yield sendMail(email, otp);
                return otp;
            }
            catch (error) {
                throw error;
            }
        });
    }
    verifyOtp(email, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutor = yield this.tutorRepo.findByEmailOtp(email);
                if (tutor && tutor.otp === otp && tutor.expiresAt > new Date()) {
                    tutor.isVerified = true;
                    yield tutor.save();
                    return tutor;
                }
                return null;
            }
            catch (error) {
                console.error("Error in OTP verification:", error);
                throw error;
            }
        });
    }
    resendOtp(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTutor = yield this.tutorRepo.findByEmail(email);
                if (!existingTutor) {
                    throw new Error('Tutor not found');
                }
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                console.log("Resend OTP:", otp);
                yield sendMail(email, otp);
                return yield this.tutorRepo.updateOtp(email, otp, expiresAt);
            }
            catch (error) {
                throw error;
            }
        });
    }
    googlesignIn(tutorData) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingTutor = yield this.tutorRepo.findByEmail(tutorData.email);
            if (existingTutor) {
                const accessToken = generateAccessToken(existingTutor._id.toString());
                const refreshToken = generateRefreshToken(existingTutor._id.toString());
                return { tutor: existingTutor, accessToken, refreshToken };
            }
            const newTutor = yield this.tutorRepo.create({
                email: tutorData.email,
                name: tutorData.name || "Unknown",
                mobile: '0',
                googleId: tutorData.uid,
                isVerified: true,
                otp: "",
                expiresAt: new Date(),
                password: "",
            });
            if (!newTutor) {
                throw new Error('Failed to create new tutor');
            }
            const accessToken = generateAccessToken(newTutor._id.toString());
            const refreshToken = generateRefreshToken(newTutor._id.toString());
            return { tutor: newTutor, accessToken, refreshToken };
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const tutor = yield this.tutorRepo.findByEmail(email);
            if (!tutor) {
                throw new Error('Invalid Email');
            }
            if (tutor.is_blocked) {
                throw new Error('Your account has been blocked. Contact support.');
            }
            const isPasswordValid = yield comparePassword(password, tutor.password);
            if (!isPasswordValid) {
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
        });
    }
    verifyTutor(tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutor = yield this.tutorRepo.findById(tutorId);
                if (!tutor) {
                    return null;
                }
                return tutor;
            }
            catch (error) {
                console.error("Error verifying tutor:", error);
                throw error;
            }
        });
    }
    renewAccessToken(tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutor = yield this.tutorRepo.findById(tutorId);
                if (!tutor) {
                    throw new Error("Tutor not found");
                }
                return generateAccessToken(tutor._id.toString());
            }
            catch (error) {
                console.error("Error renewing access token:", error);
                throw error;
            }
        });
    }
    getTutorProfile(tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tutor = yield this.tutorRepo.getTutorProfile(tutorId);
            if (!tutor) {
                throw new Error('Profile not found');
            }
            return tutor;
        });
    }
    updateTutorProfile(tutorId, profileData) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedTutor = yield this.tutorRepo.updateTutorProfile(tutorId, profileData);
            if (!updatedTutor) {
                console.error(`Service: No tutor found or update failed for ID ${tutorId}`);
                throw new Error('Failed to update profile');
            }
            return updatedTutor;
        });
    }
    validateLanguage(languageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const language = yield this.tutorRepo.findLanguageById(languageId);
            return !!language;
        });
    }
    uploadProfilePicture(tutorId, profilePicture) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedTutor = yield this.tutorRepo.uploadProfilePicture(tutorId, profilePicture);
            if (!updatedTutor) {
                throw new Error('Failed to update profile picture');
            }
            return updatedTutor;
        });
    }
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutor = yield this.tutorRepo.findByEmail(email);
                if (!tutor) {
                    throw new Error('No tutor found with this email');
                }
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                console.log("Forgot OTP:", otp);
                yield this.tutorRepo.updateOtp(email, otp, expiresAt);
                const emailMessage = `Your OTP code for password reset is ${otp}. It will expire in 5 minutes`;
                yield sendMail(email, emailMessage);
            }
            catch (error) {
                throw error;
            }
        });
    }
    resetPassword(email, otp, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutor = yield this.tutorRepo.findByEmail(email);
                if (!tutor) {
                    throw new Error('Tutor not found');
                }
                if (!tutor.otp || tutor.otp !== otp) {
                    throw new Error('Invalid OTP');
                }
                if (tutor.expiresAt < new Date()) {
                    throw new Error('OTP has expired');
                }
                const hashedPassword = yield hashPassword(newPassword);
                const updatedTutor = yield this.tutorRepo.updatePasswordAndClearOtp(email, hashedPassword);
                if (!updatedTutor) {
                    throw new Error('Failed to reset password');
                }
                return updatedTutor;
            }
            catch (error) {
                console.error('Reset Password Error:', error);
                throw error;
            }
        });
    }
    changePassword(tutorId, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const tutor = yield this.tutorRepo.findById(tutorId);
            if (!tutor) {
                throw new Error('Invalid User');
            }
            const isPasswordCorrect = yield bcrypt.compare(currentPassword, tutor.password);
            if (!isPasswordCorrect) {
                throw new Error('Invalid password');
            }
            const hashedPassword = yield hashPassword(newPassword);
            const updatePassword = yield this.tutorRepo.changePassword(tutorId, hashedPassword);
            if (!updatePassword) {
                throw new Error("Couldn't update password");
            }
            return updatePassword;
        });
    }
    getEnrolledStudents(tutorId, requestingTutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (tutorId !== requestingTutorId) {
                throw new Error('Unauthorized: You can only view your own enrolled students');
            }
            try {
                const enrolledStudents = yield this.enrollmentRepository.getEnrolledStudentsByTutor(tutorId);
                return {
                    success: true,
                    message: 'Enrolled students retrieved successfully',
                    enrolledStudents,
                    total: enrolledStudents.length,
                };
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : 'Failed to fetch enrolled students');
            }
        });
    }
}
export default new TutorService(tutorRepo);
