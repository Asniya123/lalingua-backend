import {
  CreateCourseDTO,
  ICourse,
  ICourseRepository,
  ICourseService,
} from "../../interface/ICourse";
import courseRepo from "../../repositories/tutor/courseRepo";

class CourseService implements ICourseService {
  private courseRepository: ICourseRepository;
  constructor(courseRepository: ICourseRepository) {
    this.courseRepository = courseRepository;
  }

  async addCourse(courseData: {
  courseTitle: string;
  imageUrl: string;
  category: string;
  language: string;
  description: string;
  regularPrice: number;
  tutorId: string;
}): Promise<ICourse | null> {
    if (
      !courseData.courseTitle ||
      !courseData.imageUrl ||
      !courseData.category ||
      !courseData.language ||
      !courseData.description ||
      courseData.regularPrice <= 0 ||
      !courseData.tutorId
    ) {
      throw new Error(
        "All fields are required, and price must be greater than 0."
      );
    }

    const course: CreateCourseDTO = {
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

    const existingCourse = await this.courseRepository.addCourse(course); 
    if (!existingCourse) throw new Error("Course already exists");
    return existingCourse;
  }

  async listCourses(
    tutorId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ courses: ICourse[]; total: number }> {
    return await this.courseRepository.listCourses(
      tutorId,
      page,
      limit,
      search
    );
  }

  async getCourse(courseId: string): Promise<ICourse | null> {
    if (!courseId) throw new Error("Course ID is required");

    const courseData = await this.courseRepository.findById(courseId);

    return courseData;
  }

  async editCourse(
    courseId: string,
    courseData: Partial<ICourse>
  ): Promise<ICourse | null> {
    if (!courseId) throw new Error("Course ID is required");
    return await this.courseRepository.editCourse(courseId, courseData);
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    if (!courseId) throw new Error("Course ID is required");
    return await this.courseRepository.deleteCourse(courseId);
  }
}

export default new CourseService(courseRepo);
