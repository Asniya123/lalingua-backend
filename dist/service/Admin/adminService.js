var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import adminRepository from "../../repositories/admin/adminRepository.js";
import studentRepository from "../../repositories/student/studentRepo.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/tokenUtils.js";
import tutorRepository from "../../repositories/tutor/tutorRepo.js";
import { sendMail } from "../../utils/sendMail.js";
import courseRepo from "../../repositories/tutor/courseRepo.js";
class AdminService {
    constructor(adminRepository, studentRepository, tutorRepository, courseRepository) {
        this.adminRepository = adminRepository;
        this.studentRepository = studentRepository;
        this.tutorRepository = tutorRepository;
        this.courseRepository = courseRepository;
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const admin = yield this.adminRepository.findByEmail(email);
            if (!admin) {
                throw new Error("Admin not found");
            }
            const isPasswordValid = password === admin.password;
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
        });
    }
    getUsers(page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.studentRepository.getUsers(page, limit, search);
        });
    }
    blockUnblock(userId, isBlocked) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.studentRepository.findById(userId);
                if (!user) {
                    throw new Error("User not found");
                }
                user.is_blocked = isBlocked;
                yield user.save();
                return user;
            }
            catch (error) {
                console.error('Error in blockUnblock:', error);
                throw new Error(`Failed to block/unblock user: ${error.message}`);
            }
        });
    }
    getTutors(page_1, limit_1) {
        return __awaiter(this, arguments, void 0, function* (page, limit, query = { status: 'approved' }, search) {
            return yield this.tutorRepository.getTutors(page, limit, query, search);
        });
    }
    tutorManagement(tutorId, isBlocked) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutor = yield this.tutorRepository.findById(tutorId);
                if (!tutor) {
                    throw new Error("User not found");
                }
                tutor.is_blocked = isBlocked;
                yield tutor.save();
                return tutor;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    }
    getAllTutors() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.tutorRepository.getAllTutors();
        });
    }
    updateTutorStatus(tutorId, status, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const tutor = yield this.tutorRepository.findById(tutorId);
            if (!tutor) {
                throw new Error('Tutor not found');
            }
            tutor.status = status;
            yield tutor.save();
            if (status === 'rejected' && reason) {
                yield sendMail(tutor.email, `Dear ${tutor.name}, \n\nYour tutor registration has been rejected. \nReason: ${reason}\n\nBest regards, \nAdmin Team`);
            }
            return {
                success: true,
                message: `Tutor status updated to ${status}`
            };
        });
    }
    getCourse(page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.courseRepository.getCourse(page, limit, search);
            }
            catch (error) {
                console.error('Error in CourseService.getCourse:', error);
                throw new Error('Service failed to fetch courses');
            }
        });
    }
    blockedUnblocked(courseId, isBlocked) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const course = yield this.courseRepository.findById(courseId);
                if (!course) {
                    throw new Error("Course not found");
                }
                return yield this.courseRepository.updateBlockStatus(courseId, isBlocked);
            }
            catch (error) {
                console.error('Error in blockedUnblocked:', error);
                throw new Error(`Failed to block/unblock course: ${error.message}`);
            }
        });
    }
}
export default new AdminService(adminRepository, studentRepository, tutorRepository, courseRepo);
