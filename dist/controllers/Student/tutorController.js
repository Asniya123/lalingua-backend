var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class TutorController {
    constructor(tutorService) {
        this.tutorService = tutorService;
    }
    getAllTutors(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutors = yield this.tutorService.getAllTutors();
                res.status(200).json(tutors);
            }
            catch (error) {
                res.status(500).json({ message: error.message || 'Failed to fetch tutors' });
            }
        });
    }
    getTutorById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { tutorId } = req.params;
                if (!tutorId) {
                    res.status(400).json({
                        success: false,
                        message: 'Tutor Id is required'
                    });
                    return;
                }
                const result = yield this.tutorService.getTutorById(tutorId);
                if (!result.success) {
                    res.status(404).json({
                        success: false,
                        message: 'Tutor not found',
                    });
                    return;
                }
                res.status(200).json(result);
            }
            catch (error) {
                const err = error;
                res.status(500).json({
                    success: false,
                    message: err.message || 'Internal server error'
                });
            }
        });
    }
}
