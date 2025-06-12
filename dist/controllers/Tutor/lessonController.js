var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class LessonController {
    constructor(lessonService) {
        this.lessonService = lessonService;
    }
    addLesson(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, description, videoUrl, courseId, introVideoUrl, syllabus } = req.body;
                if (!title || !description || !videoUrl || !courseId || !introVideoUrl || !syllabus) {
                    res.status(400).json({ error: 'All fields are required' });
                    return;
                }
                const lesson = yield this.lessonService.addLesson({
                    title,
                    description,
                    videoUrl,
                    courseId,
                    introVideoUrl,
                    syllabus
                });
                res.status(201).json({ message: 'Lesson added successfully', lesson });
            }
            catch (error) {
                console.error('Controller error in addLesson:', error);
                res.status(400).json({
                    error: error instanceof Error ? error.message : 'Failed to add lesson',
                });
            }
        });
    }
    listLesson(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const courseId = req.params.courseId;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 5;
                if (!courseId) {
                    res.status(400).json({ success: false, message: "Course ID is required" });
                    return;
                }
                const { lessons, total } = yield this.lessonService.listLesson(courseId, page, limit);
                res.status(200).json({
                    success: true,
                    message: "Lessons retrieved successfully",
                    lessons,
                    total,
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to fetch lessons";
                console.error("Controller error in listLesson:", error);
                res.status(500).json({
                    success: false,
                    message: errorMessage,
                });
            }
        });
    }
    getLesson(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { lessonId } = req.params;
                const lesson = yield this.lessonService.getLesson(lessonId);
                res.status(200).json({ message: "Lesson retrieved successfully", lesson });
            }
            catch (error) {
                res.status(404).json({
                    message: error instanceof Error ? error.message : "Failed to fetch lesson",
                });
            }
        });
    }
    editLesson(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { lessonId } = req.params;
                const { title, description, videoUrl, courseId, syllabus } = req.body;
                if (!lessonId) {
                    res.status(400).json({ error: "Lesson ID is required" });
                    return;
                }
                const lessonData = {
                    title,
                    description,
                    videoUrl,
                    courseId,
                    syllabus
                };
                const updatedLesson = yield this.lessonService.editLesson(lessonId, lessonData);
                res.status(200).json({ message: "Lesson updated successfully", lesson: updatedLesson });
            }
            catch (error) {
                console.error("Edit lesson error:", error);
                res.status(400).json({
                    error: error instanceof Error ? error.message : "Failed to update lesson",
                });
            }
        });
    }
    deleteLesson(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { lessonId } = req.params;
                if (!lessonId) {
                    res.status(400).json({ error: "Lesson ID is required" });
                    return;
                }
                yield this.lessonService.deleteLesson(lessonId);
                res.status(200).json({ message: "Lesson deleted successfully" });
            }
            catch (error) {
                console.error("Delete lesson error:", error);
                res.status(400).json({
                    error: error instanceof Error ? error.message : "Failed to delete lesson",
                });
            }
        });
    }
}
