var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from "jsonwebtoken";
export default class Tutorcontroller {
    constructor(tutorService) {
        this.tutorService = tutorService;
    }
    googlesignIn(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutorData = req.body;
                const { tutor, accessToken, refreshToken } = yield this.tutorService.googlesignIn(tutorData);
                res.cookie("tutorToken", accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                });
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                });
                res.status(200).json({
                    message: "Google Sign-In successful",
                    tutor: {
                        _id: tutor._id,
                        name: tutor.name,
                        email: tutor.email,
                        mobile: tutor.mobile,
                    },
                    accessToken,
                    refreshToken,
                });
            }
            catch (error) {
                console.error("Google Sign-In Error:", error.message);
                res.status(500).json({
                    message: "Failed to sign in with Google",
                    error: error.message,
                });
            }
        });
    }
    registerTutor(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newTutor = yield this.tutorService.registerTutor(req.body);
                if (newTutor) {
                    res.status(201).json({
                        message: "OTP sent to mail. Please verify your OTP to complete registration",
                        tutor: {
                            id: newTutor._id,
                            name: newTutor.name,
                            email: newTutor.email,
                            mobile: newTutor.mobile,
                        },
                    });
                }
            }
            catch (error) {
                console.error("Error during registration:", error);
                res.status(400).json({
                    message: error instanceof Error
                        ? error.message
                        : "Error occurred during registration",
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
                const isVerified = yield this.tutorService.verifyOtp(email, otp);
                if (isVerified) {
                    res.status(200).json({
                        message: "OTP verified successfully",
                        tutor: {
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
                    message: error instanceof Error
                        ? error.message
                        : "Error occurred during OTP verification",
                });
            }
        });
    }
    resendOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                const tutor = yield this.tutorService.resendOtp(email);
                if (tutor) {
                    res.status(200).json({ message: "OTP resend successfully" });
                }
                else {
                    res.status(400).json({ message: "Failed resend OTP" });
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
                const { accessToken, refreshToken, tutor } = yield this.tutorService.login(email, password);
                res
                    .status(200)
                    .json({ message: "login success", accessToken, refreshToken, tutor });
            }
            catch (error) {
                if (error instanceof Error) {
                    res
                        .status(404)
                        .json({ message: error.message || "Something went wrong" });
                }
                else {
                    res.status(500).json({ message: "Invalid server error" });
                }
            }
        });
    }
    refreshTutorAccessToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authHeader = req.header("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    res
                        .status(400)
                        .json({ message: "Authorization header missing or malformed." });
                    return;
                }
                const refreshToken = authHeader.split(" ")[1];
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                if (!(decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
                    res.status(400).json({ message: "Invalid refresh token structure." });
                    return;
                }
                const tutor = yield this.tutorService.verifyTutor(decoded.id);
                if (!tutor) {
                    res.status(403).json({ message: "Tutor not found." });
                    return;
                }
                if (tutor.is_blocked) {
                    res
                        .status(403)
                        .json({
                        message: "Your account has been blocked by the admin. Please contact support.",
                    });
                    return;
                }
                const newAccessToken = yield this.tutorService.renewAccessToken(decoded.id);
                res.status(200).json({
                    accessToken: newAccessToken,
                    message: "Token refreshed successfully",
                });
            }
            catch (error) {
                console.error("Refresh Token Error:", error);
                if (error instanceof jwt.TokenExpiredError) {
                    res
                        .status(403)
                        .json({ message: "Refresh token expired. Please log in again." });
                }
                else {
                    res.status(403).json({ message: "Invalid refresh token." });
                }
            }
        });
    }
    getTutorProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.tutor || !req.tutor._id) {
                    res.status(403).json({ message: "forbiden access" });
                    return;
                }
                const tutorId = req.tutor._id;
                const tutor = yield this.tutorService.getTutorProfile(tutorId);
                if (!tutor) {
                    res.status(404).json({ message: "Tutor not found" });
                    return;
                }
                res.status(200).json(tutor);
            }
            catch (error) {
                console.error("Error fetching tutor profile:", error);
                res.status(500).json({ message: "Internal server Error" });
            }
        });
    }
    updateTutorProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.tutor || !req.tutor._id) {
                    res.status(403).json({ message: "Unauthorized access" });
                    return;
                }
                const tutorId = req.tutor._id;
                const { name, email, mobile, documents, qualification, language, country, experience, specialization, dateOfBirth, bio, } = req.body;
                const updateData = {};
                if (name !== undefined)
                    updateData.name = name;
                if (email !== undefined)
                    updateData.email = email;
                if (mobile !== undefined)
                    updateData.mobile = mobile;
                if (documents !== undefined)
                    updateData.documents = documents;
                if (qualification !== undefined)
                    updateData.qualification = qualification;
                if (language !== undefined) {
                    if (language) {
                        const isValidLanguage = yield this.tutorService.validateLanguage(language);
                        if (!isValidLanguage) {
                            res.status(400).json({ message: "Invalid language ID" });
                            return;
                        }
                    }
                    updateData.language = language;
                }
                if (country !== undefined)
                    updateData.country = country;
                if (experience !== undefined)
                    updateData.experience = experience;
                if (specialization !== undefined)
                    updateData.specialization = specialization;
                if (dateOfBirth !== undefined) {
                    if (dateOfBirth && isNaN(new Date(dateOfBirth).getTime())) {
                        res.status(400).json({ message: "Invalid date of birth" });
                        return;
                    }
                    updateData.dateOfBirth = dateOfBirth;
                }
                if (bio !== undefined)
                    updateData.bio = bio;
                const updatedTutor = yield this.tutorService.updateTutorProfile(tutorId, updateData);
                if (!updatedTutor) {
                    res.status(404).json({ message: "Failed to update profile" });
                    return;
                }
                res.status(200).json({ message: "Profile updated successfully", tutor: updatedTutor });
            }
            catch (error) {
                console.error("Controller: Error updating tutor profile:", error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });
    }
    uploadProfilePicture(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.tutor || !req.tutor._id) {
                    res.status(404).json({ message: "Unauthorized access" });
                    return;
                }
                const tutorId = req.tutor._id;
                const { profilePicture } = req.body;
                if (!profilePicture) {
                    res.status(400).json({ message: "Profile picture URL is required" });
                    return;
                }
                const updatedTutor = yield this.tutorService.uploadProfilePicture(tutorId, profilePicture);
                if (!updatedTutor) {
                    res.status(404).json({ message: "Failed to update profile picture" });
                    return;
                }
                res
                    .status(200)
                    .json({
                    message: "Profile picture updated successfully",
                    tutor: updatedTutor,
                });
            }
            catch (error) {
                console.error("Error uploading profile picture:", error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });
    }
    forgotPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    res.status(400).json({ message: "Email is required" });
                    return;
                }
                yield this.tutorService.forgotPassword(email);
                res
                    .status(200)
                    .json({ message: "OTP sent to your email for password reset" });
            }
            catch (error) {
                res.status(400).json({
                    message: error instanceof Error
                        ? error.message
                        : "Error occurred during forgot password reset",
                });
            }
        });
    }
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, otp, newPassword } = req.body;
                if (!email || !otp || !newPassword) {
                    res
                        .status(400)
                        .json({ message: "Email, OTP and new password are required" });
                    return;
                }
                const updatedTutor = yield this.tutorService.resetPassword(email, otp, newPassword);
                res
                    .status(200)
                    .json({ message: "Password reset successfully", tutor: updatedTutor });
            }
            catch (error) {
                res.status(400).json({
                    message: error instanceof Error
                        ? error.message
                        : "Error occurred during password reset",
                });
            }
        });
    }
    changePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res
                    .status(400)
                    .json({ message: "Current password and new password are required" });
                return;
            }
            try {
                const tutorId = (_a = req.tutor) === null || _a === void 0 ? void 0 : _a._id;
                if (!tutorId) {
                    res.status(403).json({ message: "Unauthorized, tutor ID not found" });
                    return;
                }
                const tutor = yield this.tutorService.changePassword(tutorId, currentPassword, newPassword);
                if (!tutor) {
                    res.status(404).json({ message: "Tutor not found" });
                    return;
                }
                res.status(200).json({ message: "Password changed successfully" });
            }
            catch (error) {
                res
                    .status(400)
                    .json({ message: error.message || "Failed to change password" });
            }
        });
    }
    getEnrolledStudents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const tutorId = req.params.tutorId;
            const requestingTutorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!tutorId) {
                res.status(400).json({ success: false, message: 'Tutor ID is required' });
                return;
            }
            if (!requestingTutorId) {
                res.status(401).json({ success: false, message: 'Unauthorized: No user authenticated' });
                return;
            }
            try {
                const result = yield this.enrollmentService.getEnrolledStudents(tutorId, requestingTutorId);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : 'Server error',
                });
            }
        });
    }
}
