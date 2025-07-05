var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class ReviewController {
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    createReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    res.status(401).json({ success: false, message: "Unauthorized" });
                    return;
                }
                const reviewInput = {
                    userId,
                    courseId: req.body.courseId,
                    rating: req.body.rating,
                    comment: req.body.comment,
                };
                const result = yield this.reviewService.createReview(reviewInput);
                res.status(result.success ? 201 : 400).json(result);
            }
            catch (error) {
                console.error("Error in createReview:", error);
                res.status(500).json({ success: false, message: "Server error" });
            }
        });
    }
    getReviewById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reviewId = req.params.reviewId;
                const result = yield this.reviewService.getReviewById(reviewId);
                res.status(result.success ? 200 : 404).json(result);
            }
            catch (error) {
                console.error("Error in getReviewById:", error);
                res.status(500).json({ success: false, message: "Server error" });
            }
        });
    }
    getReviewsByCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const courseId = req.params.courseId;
                const result = yield this.reviewService.getReviewsByCourse(courseId);
                res.status(result.success ? 200 : 404).json(result);
            }
            catch (error) {
                console.error("Error in getReviewsByCourse:", error);
                res.status(500).json({ success: false, message: "Server error" });
            }
        });
    }
    updateReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    res.status(401).json({ success: false, message: "Unauthorized" });
                    return;
                }
                const reviewId = req.params.reviewId;
                const updateData = {
                    rating: req.body.rating,
                    comment: req.body.comment,
                };
                const result = yield this.reviewService.updateReview(reviewId, updateData);
                res.status(result.success ? 200 : 404).json(result);
            }
            catch (error) {
                console.error("Error in updateReview:", error);
                res.status(500).json({ success: false, message: "Server error" });
            }
        });
    }
    deleteReview(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId) {
                    res.status(401).json({ success: false, message: "Unauthorized" });
                    return;
                }
                const reviewId = req.params.reviewId;
                const result = yield this.reviewService.deleteReview(reviewId);
                res.status(result.success ? 200 : 404).json(result);
            }
            catch (error) {
                console.error("Error in deleteReview:", error);
                res.status(500).json({ success: false, message: "Server error" });
            }
        });
    }
    getStudentById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const studentId = req.params.studentId;
                const result = yield this.reviewService.getStudentById(studentId);
                res.status(result.success ? 200 : 404).json(result);
            }
            catch (error) {
                console.error("Error in getStudentById controller:", error);
                res.status(500).json({ success: false, message: "Server error" });
            }
        });
    }
}
