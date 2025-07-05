var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class EnrollmentController {
    constructor(enrollmentSevice) {
        this.enrollmentService = enrollmentSevice;
    }
    getEnrolledStudentsByTutor(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Get tutorId from query params first, then fallback to middleware
                const tutorId = req.query.tutorId || ((_a = req.tutor) === null || _a === void 0 ? void 0 : _a._id);
                if (!tutorId) {
                    res.status(400).json({
                        success: false,
                        message: "Tutor ID is required",
                    });
                    return;
                }
                console.log(`Controller: Received request for tutorId: ${tutorId}`);
                const result = yield this.enrollmentService.getEnrolledStudentsByTutor(tutorId);
                console.log(`Controller: Returning ${result.enrolledStudents.length} enrolled students`);
                res.status(200).json({
                    success: true,
                    enrolledStudents: result.enrolledStudents,
                    total: result.total,
                });
            }
            catch (error) {
                console.error("Controller error:", error);
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Error fetching enrolled students",
                });
            }
        });
    }
}
