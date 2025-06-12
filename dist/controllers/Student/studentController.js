var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class StudentController {
    constructor(studentService) {
        this.studentService = studentService;
    }
    registerStudent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newStudent = yield this.studentService.registerStudent(req.body);
                if (newStudent) {
                    res.status(201).json({
                        message: "OTP sent to mail. Please verify your OTP to complete registration",
                        student: {
                            id: newStudent._id,
                            name: newStudent.name,
                            email: newStudent.email,
                            mobile: newStudent.mobile,
                        },
                    });
                }
            }
            catch (error) {
                res.status(400).json({
                    message: error instanceof Error ? error.message : "Error occurred during registration",
                });
            }
        });
    }
    verifyOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, otp } = req.body;
                if (!email || !otp) {
                    throw new Error("Email and OTP are required");
                }
                const isVerified = yield this.studentService.verifyOtp(email, otp);
                if (isVerified) {
                    res.status(200).json({
                        message: "OTP verified successfully",
                        student: {
                            id: isVerified._id,
                            name: isVerified.name,
                            email: isVerified.email,
                        },
                    });
                }
                else {
                    res.status(400).json({ message: "Invalid or expired OTP" });
                }
            }
            catch (error) {
                res.status(400).json({
                    message: error instanceof Error ? error.message : "Error occurred during OTP verification",
                });
            }
        });
    }
    resendOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                const student = yield this.studentService.resendOtp(email);
                if (student) {
                    res.status(200).json({ message: "OTP resent successfully" });
                }
                else {
                    res.status(400).json({ message: "Failed to resend OTP" });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                res.status(500).json({ message: errorMessage });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                const login = yield this.studentService.login(email, password);
                res.status(200).json({ message: 'Login success', login });
            }
            catch (error) {
                if (error.status === 403) {
                    res.status(403).json({ status: 403, message: error.message });
                }
                else if (error instanceof Error) {
                    res.status(403).json({ message: error.message || 'Something went wrong.' });
                }
                else {
                    res.status(500).json({ message: 'Internal server error' });
                }
            }
        });
    }
    googlesignIn(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const studentData = req.body;
                const { student, accessToken, refreshToken } = yield this.studentService.googlesignIn(studentData);
                res.status(200).json({
                    message: 'Google Sign-In successful',
                    student: {
                        _id: student._id,
                        name: student.name,
                        email: student.email,
                        mobile: student.mobile,
                    },
                    accessToken,
                    refreshToken,
                });
            }
            catch (error) {
                console.error('Google Sign-In Error:', error.message);
                res.status(500).json({
                    message: 'Failed to sign in with Google',
                    error: error.message,
                });
            }
        });
    }
    getStudentProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user || !req.user._id) {
                    res.status(403).json({ message: "Unauthorized access" });
                    return;
                }
                const studentId = req.user._id;
                const student = yield this.studentService.getStudentProfile(studentId);
                if (!student) {
                    res.status(404).json({ message: "Student not found" });
                    return;
                }
                res.status(200).json(student);
            }
            catch (error) {
                console.error("Error fetching student profile:", error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });
    }
    updateStudentProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user || !req.user._id) {
                    res.status(404).json({ message: "Unauthorized access" });
                    return;
                }
                const studentId = req.user._id;
                const { name, email, mobile } = req.body;
                if (!name || !email || !mobile) {
                    res.status(400).json({ message: "All fields are required" });
                    return;
                }
                const updatedStudent = yield this.studentService.updateStudentProfile(studentId, {
                    name,
                    email,
                    mobile,
                });
                if (!updatedStudent) {
                    res.status(404).json({ message: "Failed to update profile" });
                    return;
                }
                res.status(200).json({ message: "Profile updated successfully", student: updatedStudent });
            }
            catch (error) {
                console.error("Error updating student profile:", error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });
    }
    uploadProfilePicture(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user || !req.user._id) {
                    res.status(403).json({ message: 'Unauthorized access' });
                    return;
                }
                const studentId = req.user._id;
                const { profilePicture } = req.body;
                if (!profilePicture) {
                    res.status(400).json({ message: 'Profile picture URL is required' });
                    return;
                }
                const updatedStudent = yield this.studentService.uploadProfilePicture(studentId, profilePicture);
                if (!updatedStudent) {
                    res.status(404).json({ message: 'Failed to update profile picture' });
                    return;
                }
                res.status(200).json({ message: 'Profile picture updated successfully', student: updatedStudent });
            }
            catch (error) {
                console.error('Error uploading profile picture:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });
    }
    forgotPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    res.status(400).json({ message: 'Email is required' });
                    return;
                }
                yield this.studentService.forgotPassword(email);
                res.status(200).json({ message: 'OTP sent to your email for password reset' });
            }
            catch (error) {
                res.status(400).json({
                    message: error instanceof Error ? error.message : 'Error occured during forgot password rest'
                });
            }
        });
    }
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, otp, newPassword } = req.body;
                if (!email || !otp || !newPassword) {
                    res.status(400).json({ message: "Email, OTP, and new password are required" });
                    return;
                }
                const updatedStudent = yield this.studentService.resetPassword(email, otp, newPassword);
                res.status(200).json({ message: "Password reset successfully", student: updatedStudent });
            }
            catch (error) {
                res.status(400).json({
                    message: error instanceof Error ? error.message : "Error occurred during password reset",
                });
            }
        });
    }
    changePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({ message: 'Current password and new password are required' });
                return;
            }
            try {
                const studentId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!studentId) {
                    res.status(403).json({ message: 'Unauthorized, student ID not found' });
                    return;
                }
                const student = yield this.studentService.changePassword(studentId, currentPassword, newPassword);
                if (!student) {
                    res.status(404).json({ message: 'Student not found' });
                    return;
                }
                res.status(200).json({ message: 'Password changed successfully' });
            }
            catch (error) {
                res.status(400).json({ message: error.message || 'Failed to change password' });
            }
        });
    }
    //Language
    getLanguages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const languages = yield this.studentService.getLanguages();
                res.status(200).json({ success: true, data: languages });
            }
            catch (error) {
                res.status(500).json({ success: false, message: "Failed to fetch languages" });
            }
        });
    }
}
