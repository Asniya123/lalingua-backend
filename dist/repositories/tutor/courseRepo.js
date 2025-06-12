var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import CourseModel from "../../models/courseModel.js";
class CourseRepository {
    addCourse(courseData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingCourse = yield CourseModel.findOne({ courseTitle: courseData.courseTitle });
                if (existingCourse)
                    return null;
                const result = yield CourseModel.create(courseData);
                return result;
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        });
    }
    listCourses(tutorId, page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                // Build the base query with tutorId
                let baseQuery = { tutorId };
                // Add search conditions to the base query if search term exists
                if (search && search.trim()) {
                    baseQuery = {
                        tutorId,
                        $or: [
                            { courseTitle: { $regex: search.trim(), $options: 'i' } }, // Changed from 'name' to 'courseTitle'
                            { description: { $regex: search.trim(), $options: 'i' } },
                        ],
                    };
                }
                const [courses, total] = yield Promise.all([
                    CourseModel.find(baseQuery)
                        .populate("category")
                        .populate("language")
                        .skip(skip)
                        .limit(limit)
                        .exec(),
                    CourseModel.countDocuments(baseQuery).exec(), // Use the same query for counting
                ]);
                return { courses, total };
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    findById(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield CourseModel.findById(courseId).exec();
        });
    }
    editCourse(courseId, courseData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield CourseModel.findByIdAndUpdate(courseId, courseData, { new: true, runValidators: true }).exec();
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    deleteCourse(courseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield CourseModel.findByIdAndDelete(courseId).exec();
                return !!result;
            }
            catch (error) {
                throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    getCourse(page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const query = search
                    ? {
                        $or: [
                            { courseTitle: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } },
                            { 'category.name': { $regex: search, $options: 'i' } },
                            { 'language.name': { $regex: search, $options: 'i' } },
                        ],
                        isBlock: false,
                    }
                    : { isBlock: false };
                const [courses, total] = yield Promise.all([
                    CourseModel.find(query)
                        .populate("category", "name")
                        .populate("language", "name")
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    CourseModel.countDocuments(query),
                ]);
                return { courses, total };
            }
            catch (error) {
                console.error('Error in CourseRepository.getCourse:', error);
                throw new Error('Failed to fetch courses from database');
            }
        });
    }
    updateBlockStatus(courseId, isBlocked) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield CourseModel.findByIdAndUpdate(courseId, { isBlock: isBlocked }, { new: true });
            if (!course) {
                throw new Error("Course not found");
            }
            return course;
        });
    }
}
export default new CourseRepository;
