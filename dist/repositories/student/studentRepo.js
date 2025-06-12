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
import studentModel from "../../models/studentModel.js";
class StudentRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield studentModel.create(data);
            }
            catch (error) {
                console.error("Error creating student:", error);
                throw error;
            }
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const student = yield studentModel.findOne({ email });
                return student;
            }
            catch (error) {
                console.error("Error finding student by email:", error);
                throw error;
            }
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield studentModel.findById(id);
            }
            catch (error) {
                console.error("Error finding student by ID", error);
                throw error;
            }
        });
    }
    findGoogleId(googleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield studentModel.findOne({ google_id: googleId });
        });
    }
    createOtp(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, otp, expiresAt } = data;
                return yield studentModel.findOneAndUpdate({ email }, { otp, expiresAt });
            }
            catch (error) {
                throw error;
            }
        });
    }
    findByEmailOtp(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield studentModel.find({ email }).sort({ createdAt: -1 }).limit(1);
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
                return yield studentModel.findOneAndUpdate({ email }, { otp, expiresAt });
            }
            catch (error) {
                throw error;
            }
        });
    }
    updatePasswordAndClearOtp(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield studentModel.findOneAndUpdate({ email }, { password, otp: null, expiresAt: null }, { new: true }).exec();
        });
    }
    getUsers(page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const query = search
                    ? {
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { email: { $regex: search, $options: 'i' } },
                        ],
                    }
                    : {};
                const [users, total] = yield Promise.all([
                    studentModel.find(query).skip(skip).limit(limit).lean(),
                    studentModel.countDocuments(query),
                ]);
                return { users, total };
            }
            catch (error) {
                console.error('Error in StudentRepository.getUsers:', error);
                throw new Error('Failed to fetch users from database');
            }
        });
    }
    getStudentProfile(studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield studentModel.findById(studentId);
        });
    }
    updateStudentProfile(studentId, profileData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, mobile } = profileData;
            return yield studentModel.findByIdAndUpdate(studentId, { name, email, mobile }, { new: true, runValidators: true });
        });
    }
    uploadProfilePicture(studentId, profilePicture) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield studentModel.findByIdAndUpdate(studentId, { profilePicture }, { new: true, runValidators: true });
        });
    }
    changePassword(studentId, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const student = yield studentModel.findOneAndUpdate({ _id: studentId }, { password: newPassword }, { new: true });
            return student;
        });
    }
    updateEnrollments(studentId, enrollmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield studentModel.findByIdAndUpdate(studentId, { $push: { enrollments: enrollmentData } }, { new: true }).exec();
            }
            catch (error) {
                console.error(`Error updating enrollments for student ${studentId}:`, error);
                throw new Error("Failed to update enrollments");
            }
        });
    }
    getContact(query, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                console.error("Invalid or missing user ID:", userId);
                throw new Error("Valid user ID is required");
            }
            const completedQuery = Object.assign(Object.assign({}, query), { is_blocked: false, _id: { $ne: userId } });
            console.log(`Repository: Fetching contacts for userId: ${userId}, query:`, completedQuery);
            const users = yield studentModel.find(completedQuery, {
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
        });
    }
    update(studentId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose.Types.ObjectId.isValid(studentId)) {
                    console.error("Invalid studentId:", studentId);
                    throw new Error("Invalid student ID");
                }
                console.log(`Repository: Updating student with ID: ${studentId}, data:`, data);
                const updatedStudent = yield studentModel
                    .findByIdAndUpdate(studentId, data, { new: true, runValidators: true })
                    .exec();
                if (!updatedStudent) {
                    console.error(`Student not found: ${studentId}`);
                    throw new Error(`Student not found: ${studentId}`);
                }
                console.log("Student updated:", JSON.stringify(updatedStudent, null, 2));
                return updatedStudent;
            }
            catch (error) {
                console.error(`Repository: Error updating student ${studentId}:`, {
                    message: error.message,
                    studentId,
                    data,
                    stack: error.stack,
                });
                throw new Error(`Failed to update student: ${error.message}`);
            }
        });
    }
}
export default new StudentRepository();
