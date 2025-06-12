var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class CourseController {
    constructor(courseService) {
        this.courseService = courseService;
        this.getCourse = this.getCourse.bind(this);
    }
    addCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.tutor || !req.tutor._id) {
                    res.status(403).json({ error: "Unauthorized access" });
                    return;
                }
                const tutorId = req.tutor._id;
                const { courseTitle, imageUrl, category, language, description, regularPrice, } = req.body;
                if (!courseTitle ||
                    !imageUrl ||
                    !category ||
                    !language ||
                    !description ||
                    regularPrice <= 0) {
                    res
                        .status(400)
                        .json({
                        error: "All fields are required, and price must be greater than 0.",
                    });
                    return;
                }
                const course = yield this.courseService.addCourse({
                    courseTitle,
                    imageUrl,
                    category,
                    language,
                    description,
                    regularPrice,
                    tutorId,
                });
                if (!course) {
                    res.status(400).json({ error: "Failed to create course" });
                    return;
                }
                const sanitizedCourse = {
                    _id: course._id,
                    courseTitle: course.courseTitle,
                    imageUrl: course.imageUrl,
                    category: course.category,
                    language: course.language,
                    description: course.description,
                    regularPrice: course.regularPrice,
                    buyCount: course.buyCount || 0,
                    createdAt: course.createdAt,
                    updatedAt: course.updatedAt,
                    tutorId: course.tutorId,
                    isBlock: course.isBlock,
                };
                res
                    .status(201)
                    .json({
                    message: "Course added successfully",
                    course: sanitizedCourse,
                });
            }
            catch (error) {
                res
                    .status(400)
                    .json({
                    error: error instanceof Error ? error.message : "Failed to add course",
                });
            }
        });
    }
    listCourses(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!((_a = req.tutor) === null || _a === void 0 ? void 0 : _a._id)) {
                    res.status(403).json({ message: "Unauthorized access" });
                    return;
                }
                const tutorId = req.tutor._id;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 5;
                const search = req.query.search || "";
                if (page < 1 || limit < 1) {
                    res.status(400).json({
                        success: false,
                        error: "Invalid pagination parameters. Page and limit must be positive numbers",
                    });
                    return; // Add return statement here
                }
                // Pass the search parameter to the service
                const { courses, total } = yield this.courseService.listCourses(tutorId, page, limit, search // Add search parameter
                );
                res.status(200).json({
                    message: "Courses retrieved successfully",
                    courses,
                    total
                });
            }
            catch (error) {
                res.status(500).json({
                    error: error instanceof Error ? error.message : "Failed to fetch courses",
                });
            }
        });
    }
    getCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { courseId } = req.params;
                if (!courseId) {
                    res.status(400).json({ error: "Course ID is required" });
                    return;
                }
                const course = yield this.courseService.getCourse(courseId);
                if (!course) {
                    res.status(404).json({ error: "Course not found" });
                    return;
                }
                res.status(200).json(course);
            }
            catch (error) {
                console.error("Error fetching course:", error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : "Failed to fetch course",
                });
            }
        });
    }
    editCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { courseId } = req.params;
                const courseData = req.body;
                if (!courseId) {
                    res.status(400).json({ error: "Course ID is required" });
                    return;
                }
                const course = yield this.courseService.editCourse(courseId, courseData);
                if (!course) {
                    res.status(404).json({ error: "Course not found" });
                    return;
                }
                res.status(200).json({ message: "Course updated successfully", course });
            }
            catch (error) {
                console.error("Error updating course:", error);
                res.status(500).json({
                    error: error instanceof Error ? error.message : "Failed to update course",
                });
            }
        });
    }
    deleteCourse(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { courseId } = req.params;
                if (!courseId) {
                    res.status(400).json({ error: "Course ID is required" });
                    return;
                }
                const success = yield this.courseService.deleteCourse(courseId);
                if (!success) {
                    res.status(404).json({ error: "Course not found" });
                    return;
                }
                res.status(200).json({ message: "Course deleted successfully" });
            }
            catch (error) {
                res
                    .status(500)
                    .json({
                    error: error instanceof Error ? error.message : "Failed to delete course",
                });
            }
        });
    }
}
