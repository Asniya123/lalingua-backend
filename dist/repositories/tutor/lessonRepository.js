var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import LessonModel from "../../models/lessonModel.js";
class LessonRepository {
    addLesson(lessonData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingLesson = yield LessonModel.findOne({ title: lessonData.title, courseId: lessonData.courseId });
                if (existingLesson)
                    return null;
                const newLesson = new LessonModel(lessonData);
                yield newLesson.save();
                return newLesson.toObject();
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    getLessonsByCourseId(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lessons = yield LessonModel.find({ courseId });
                return lessons.map((lesson) => lesson.toObject());
            }
            catch (error) {
                console.error('Error in lessonRepository.getLessonsByCourseId:', error);
                throw new Error('Failed to fetch lessons');
            }
        });
    }
    listLesson(courseId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const skip = (page - 1) * limit;
            const lessons = yield LessonModel.find({ courseId })
                .skip(skip)
                .limit(limit)
                .lean();
            const total = yield LessonModel.countDocuments({ courseId });
            return { lessons, total };
        });
    }
    getLesson(lessonId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lesson = yield LessonModel.findById(lessonId).exec();
                return lesson;
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    editLesson(lessonId, lessonData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedLesson = yield LessonModel.findByIdAndUpdate(lessonId, { $set: lessonData }, { new: true, runValidators: true }).exec();
                return updatedLesson;
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    deleteLesson(lessonId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield LessonModel.findByIdAndDelete(lessonId).exec();
                return !!result;
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    courseLesson(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const lesson = yield LessonModel.find({ courseId });
                return lesson;
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
}
export default new LessonRepository();
