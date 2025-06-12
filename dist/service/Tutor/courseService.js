var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import courseRepo from "../../repositories/tutor/courseRepo.js";
class CourseService {
    constructor(courseRepository) {
        this.courseRepository = courseRepository;
    }
    addCourse(courseData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!courseData.courseTitle ||
                !courseData.imageUrl ||
                !courseData.category ||
                !courseData.language ||
                !courseData.description ||
                courseData.regularPrice <= 0 ||
                !courseData.tutorId) {
                throw new Error("All fields are required, and price must be greater than 0.");
            }
            const course = {
                courseTitle: courseData.courseTitle,
                imageUrl: courseData.imageUrl,
                category: courseData.category,
                language: courseData.language,
                description: courseData.description,
                regularPrice: courseData.regularPrice,
                buyCount: 0,
                tutorId: courseData.tutorId,
                isBlock: false,
            };
            const existingCourse = yield this.courseRepository.addCourse(course);
            if (!existingCourse)
                throw new Error("Course already exists");
            return existingCourse;
        });
    }
    listCourses(tutorId, page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.courseRepository.listCourses(tutorId, page, limit, search);
        });
    }
    getCourse(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!courseId)
                throw new Error("Course ID is required");
            const courseData = yield this.courseRepository.findById(courseId);
            return courseData;
        });
    }
    editCourse(courseId, courseData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!courseId)
                throw new Error("Course ID is required");
            return yield this.courseRepository.editCourse(courseId, courseData);
        });
    }
    deleteCourse(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!courseId)
                throw new Error("Course ID is required");
            return yield this.courseRepository.deleteCourse(courseId);
        });
    }
}
export default new CourseService(courseRepo);
