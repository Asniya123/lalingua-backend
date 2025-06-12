var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from "mongoose";
import tutorModel from "../../models/tutorModel.js";
import CourseModel from "../../models/courseModel.js";
import EnrollmentModel from "../../models/enrollmentModel.js";
import languageModel from "../../models/languageModel.js";
class TutorRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield tutorModel.create(data);
            }
            catch (error) {
                console.error('Error creating tutor:', error);
                throw error;
            }
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield tutorModel.findOne({ email });
            }
            catch (error) {
                console.error('Error finding tutor by email:', error);
                throw error;
            }
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield tutorModel.findById(id);
            }
            catch (error) {
                console.error('Error finding tutor ID', error);
                throw error;
            }
        });
    }
    createOtp(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, otp, expiresAt } = data;
                return yield tutorModel.findOneAndUpdate({ email }, { otp, expiresAt });
            }
            catch (error) {
                throw error;
            }
        });
    }
    findByEmailOtp(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield tutorModel.find({ email }).sort({ createdAt: -1 }).limit(1);
                return result.length > 0 ? result[0] : null;
            }
            catch (error) {
                throw error;
            }
        });
    }
    updateOtp(email, otp, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield tutorModel.findOneAndUpdate({ email }, { otp, expiresAt }, { new: true, upsert: true });
            }
            catch (error) {
                throw error;
            }
        });
    }
    findGoogleId(googleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield tutorModel.findOne({ google_id: googleId });
        });
    }
    getTutors(page_1, limit_1) {
        return __awaiter(this, arguments, void 0, function* (page, limit, query = { status: 'approved' }, search) {
            try {
                const skip = (page - 1) * limit;
                const searchQuery = search
                    ? {
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { email: { $regex: search, $options: 'i' } },
                            { status: { $regex: search, $options: 'i' } },
                        ],
                    }
                    : {};
                const finalQuery = Object.assign(Object.assign({}, query), searchQuery);
                const [tutors, total] = yield Promise.all([
                    tutorModel.find(finalQuery)
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    tutorModel.countDocuments(finalQuery),
                ]);
                return { tutor: tutors, total };
            }
            catch (error) {
                console.error('Error in TutorRepository.getTutors:', error);
                throw new Error('Failed to fetch tutors from database');
            }
        });
    }
    getAllTutors() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield tutorModel.find();
        });
    }
    getTutorProfile(tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield tutorModel.findById(tutorId);
        });
    }
    updateTutorProfile(tutorId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedTutor = yield tutorModel.findByIdAndUpdate(tutorId, { $set: updateData }, { new: true, runValidators: true });
                if (!updatedTutor) {
                    console.error(`Repository: No tutor found for ID ${tutorId}`);
                }
                return updatedTutor;
            }
            catch (error) {
                console.error("Repository: Mongoose update error:", error);
                throw error;
            }
        });
    }
    findLanguageById(languageId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const language = yield languageModel.findById(languageId);
                return language;
            }
            catch (error) {
                console.error(`Repository: Error fetching language ${languageId}:`, error);
                return null;
            }
        });
    }
    uploadProfilePicture(tutorId, profilePicture) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield tutorModel.findByIdAndUpdate(tutorId, { profilePicture }, { new: true, runValidators: true });
        });
    }
    updatePasswordAndClearOtp(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield tutorModel.findOneAndUpdate({ email }, { password, otp: null, expiresAt: null }, { new: true }).exec();
        });
    }
    changePassword(tutorId, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const tutor = yield tutorModel.findOneAndUpdate({ _id: tutorId }, { password: newPassword }, { new: true });
            return tutor;
        });
    }
    getContact(query, tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(tutorId)) {
                    console.error(`Invalid tutorId: ${tutorId}`);
                    throw new Error("Invalid tutor ID");
                }
                if (!query || typeof query !== "object") {
                    console.error(`Invalid query: ${JSON.stringify(query)}`);
                    throw new Error("Invalid query parameters");
                }
                const completedQuery = Object.assign(Object.assign({}, query), { is_blocked: false, _id: { $ne: tutorId } });
                console.log(`Repository: Fetching contacts for tutorId: ${tutorId}, query: ${JSON.stringify(completedQuery)}`);
                const users = yield tutorModel
                    .find(completedQuery, {
                    _id: 1,
                    username: 1,
                    email: 1,
                    profilePicture: 1,
                })
                    .lean();
                console.log(`Contacts fetched: ${users.length} users`);
                return users;
            }
            catch (error) {
                console.error("Repository: Error fetching contacts:", {
                    message: error instanceof Error ? error.message : String(error),
                    tutorId,
                    query: JSON.stringify(query),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                throw new Error(`Failed to fetch contacts: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    getEnrolledStudentsByTutor(tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const courses = yield CourseModel.find({ tutorId }).select('_id courseTitle');
                const courseIds = courses.map(course => course._id);
                const enrollments = yield EnrollmentModel.find({ courseId: { $in: courseIds } })
                    .populate('courseId', '_id courseTitle')
                    .populate('userId', '_id name profilePicture');
                const enrolledStudents = enrollments.reduce((acc, enrollment) => {
                    if (enrollment.courseId &&
                        enrollment.courseId._id &&
                        enrollment.userId &&
                        enrollment.userId._id &&
                        enrollment.userId.name) {
                        acc.push({
                            student: {
                                _id: enrollment.userId._id.toString(),
                                name: enrollment.userId.name,
                                profilePicture: enrollment.userId.profilePicture,
                            },
                            course: {
                                _id: enrollment.courseId._id.toString(),
                                courseTitle: enrollment.courseId.courseTitle,
                            },
                        });
                    }
                    return acc;
                }, []);
                return enrolledStudents;
            }
            catch (error) {
                throw new Error('Failed to fetch enrolled students from database');
            }
        });
    }
}
export default new TutorRepository();
