var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import studentRepo from "../../repositories/student/studentRepo.js";
import { sendMail } from "../../utils/sendMail.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenUtils.js";
import { hashPassword } from "../../utils/passwordUtil.js";
import languageRepository from "../../repositories/admin/languageRepository.js";
class StudentService {
    constructor(studentRepo, languageRepository) {
        this.studentRepo = studentRepo;
        this.languageRepository = languageRepository;
    }
    registerStudent(studentData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!studentData.email) {
                    throw new Error("Email is required");
                }
                if (!studentData.name) {
                    throw new Error("Name is required");
                }
                const existingStudent = yield this.studentRepo.findByEmail(studentData.email);
                if (existingStudent) {
                    throw new Error("Student with this email already exists");
                }
                if (!studentData.password || !studentData.confirmPassword) {
                    throw new Error("Password and Confirm Password are required");
                }
                if (studentData.password !== studentData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const hashedPassword = yield hashPassword(studentData.password);
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                console.log("Generated OTP:", otp);
                const { confirmPassword } = studentData, studentDataWithoutConfirmPassword = __rest(studentData, ["confirmPassword"]);
                const newStudentData = Object.assign(Object.assign({}, studentDataWithoutConfirmPassword), { password: hashedPassword, otp,
                    expiresAt, isVerified: false });
                const newStudent = yield this.studentRepo.create(newStudentData);
                if (newStudent) {
                    const emailMessage = `Your Otp code is ${otp}.It will expire 5 min`;
                    yield sendMail(studentData.email, emailMessage);
                }
                return newStudent;
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
                yield this.studentRepo.createOtp({ email, otp, expiresAt });
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
                const student = yield this.studentRepo.findByEmailOtp(email);
                if (student && student.otp === otp && student.expiresAt > new Date()) {
                    student.isVerified = true;
                    yield student.save();
                    return student;
                }
                return null;
            }
            catch (error) {
                throw error;
            }
        });
    }
    resendOtp(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingStudent = yield this.studentRepo.findByEmail(email);
                if (!existingStudent) {
                    throw new Error('Student not found');
                }
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                console.log("Resend OTP:", otp);
                yield sendMail(email, otp);
                return yield this.studentRepo.updateOtp(email, otp, expiresAt);
            }
            catch (error) {
                throw error;
            }
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const student = yield this.studentRepo.findByEmail(email);
            if (!student) {
                throw new Error('Invalid email ');
            }
            if (student.is_blocked) {
                const error = new Error('User is blocked by admin');
                error.status = 403;
                throw error;
            }
            console.log('password', student.password, password);
            const isPasswordValid = yield bcrypt.compare(password, student.password);
            console.log(isPasswordValid, "++++");
            if (!isPasswordValid) {
                throw new Error('Invalid password');
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
                    mobile: student.mobile,
                    profilePicture: student.profilePicture,
                    is_blocked: student.is_blocked
                },
            };
        });
    }
    googlesignIn(studentData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Google Sign-In: Checking for existing student with email:", studentData.email);
            const existingStudent = yield this.studentRepo.findByEmail(studentData.email);
            if (existingStudent) {
                const accessToken = generateAccessToken(existingStudent._id.toString());
                const refreshToken = generateRefreshToken(existingStudent._id.toString());
                return { student: existingStudent, accessToken, refreshToken };
            }
            const newStudent = yield this.studentRepo.create({
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
        });
    }
    getStudentProfile(studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const student = yield this.studentRepo.getStudentProfile(studentId);
            if (!student) {
                throw new Error('Profile not found');
            }
            return student;
        });
    }
    updateStudentProfile(studentId, profileData) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatestudent = yield this.studentRepo.updateStudentProfile(studentId, profileData);
            if (!updatestudent) {
                throw new Error('Failed to update profile');
            }
            return updatestudent;
        });
    }
    uploadProfilePicture(studentId, profilePicture) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedStudent = yield this.studentRepo.uploadProfilePicture(studentId, profilePicture);
            if (!updatedStudent) {
                throw new Error('Failed to update profile picture');
            }
            return updatedStudent;
        });
    }
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield this.studentRepo.findByEmail(email);
                if (!student) {
                    throw new Error("No student found with this email");
                }
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                console.log("Forgot OTP:", otp);
                yield this.studentRepo.updateOtp(email, otp, expiresAt);
                console.log('Generated OTP for reset:', { email, otp, expiresAt });
                const emailMessage = `Your OTP code for password reset is ${otp}. It will expire in 5 minutes.`;
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
                const student = yield this.studentRepo.findByEmail(email);
                if (!student) {
                    throw new Error("Student not found");
                }
                console.log('Student OTP Data:', { storedOtp: student.otp, receivedOtp: otp, expiresAt: student.expiresAt });
                if (!student.otp || student.otp !== otp) {
                    throw new Error("Invalid OTP");
                }
                if (student.expiresAt < new Date()) {
                    throw new Error("OTP has expired");
                }
                const hashedPassword = yield hashPassword(newPassword);
                const updatedStudent = yield this.studentRepo.updatePasswordAndClearOtp(email, hashedPassword);
                if (!updatedStudent) {
                    throw new Error("Failed to reset password");
                }
                return updatedStudent;
            }
            catch (error) {
                console.error('Reset Password Error:', error);
                throw error;
            }
        });
    }
    changePassword(studentId, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const student = yield this.studentRepo.findById(studentId);
            if (!student) {
                throw new Error("Invalid User");
            }
            const isPasswordCorrect = yield bcrypt.compare(currentPassword, student.password);
            if (!isPasswordCorrect) {
                throw new Error("Ïnvalid Password");
            }
            const hashedPassword = yield hashPassword(newPassword);
            const updatePassword = this.studentRepo.changePassword(studentId, hashedPassword);
            if (!updatePassword) {
                throw new Error("couldn't update password");
            }
            return updatePassword;
        });
    }
    //Language
    getLanguages() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.languageRepository.getLanguages();
        });
    }
}
export default new StudentService(studentRepo, languageRepository);
