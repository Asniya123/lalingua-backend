var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import lessonRepository from "../../repositories/tutor/lessonRepository.js";
class LessonService {
    constructor(lessonRepository) {
        this.lessonRepository = lessonRepository;
    }
    addLesson(lessonData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lessonData.title ||
                !lessonData.description ||
                !lessonData.videoUrl ||
                !lessonData.courseId ||
                !lessonData.introVideoUrl ||
                !lessonData.syllabus) {
                throw new Error('All fields are required');
            }
            try {
                const existingLessons = yield this.lessonRepository.getLessonsByCourseId(lessonData.courseId.toString());
                console.log(`Existing lessons for courseId "${lessonData.courseId}":`, existingLessons.map((lesson) => ({
                    title: lesson.title,
                    id: lesson._id,
                })));
                const newLesson = yield this.lessonRepository.addLesson(lessonData);
                if (!newLesson) {
                    throw new Error('Lesson already exists');
                }
                return newLesson;
            }
            catch (error) {
                console.error('Error in lessonService.addLesson:', error);
                throw error;
            }
        });
    }
    listLesson(courseId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!courseId) {
                throw new Error("Course ID is required");
            }
            if (page < 1 || limit < 1) {
                throw new Error("Page and limit must be positive numbers");
            }
            try {
                const result = yield this.lessonRepository.listLesson(courseId, page, limit);
                return result;
            }
            catch (error) {
                console.error(`Service error listing lessons for courseId ${courseId}:`, error);
                throw new Error("Failed to list lessons in service");
            }
        });
    }
    getLesson(lessonId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lesson = yield this.lessonRepository.getLesson(lessonId);
            if (!lesson) {
                throw new Error("Lesson not found");
            }
            return lesson;
        });
    }
    editLesson(lessonId, lessonData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lessonId)
                throw new Error("Lesson ID is required");
            if (!lessonData.title || !lessonData.description) {
                throw new Error("Title and description are required");
            }
            const updatedLesson = yield this.lessonRepository.editLesson(lessonId, lessonData);
            if (!updatedLesson) {
                throw new Error("Lesson not found");
            }
            return updatedLesson;
        });
    }
    deleteLesson(lessonId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lessonId)
                throw new Error("Lesson ID is required");
            const deleted = yield this.lessonRepository.deleteLesson(lessonId);
            if (!deleted) {
                throw new Error("Lesson not found");
            }
            return deleted;
        });
    }
}
export default new LessonService(lessonRepository);
