
import { ILesson, ILessonInput, ILessonRepository, ILessonService } from "../../interface/ILesson";
import lessonRepository from "../../repositories/tutor/lessonRepository";

class LessonService implements ILessonService{
    private lessonRepository: ILessonRepository
    constructor(lessonRepository: ILessonRepository){
        this.lessonRepository = lessonRepository
    }

    async addLesson(lessonData: ILessonInput): Promise<ILesson | null> {
  if (
    !lessonData.title ||
    !lessonData.description ||
    !lessonData.videoUrl ||
    !lessonData.courseId ||
    !lessonData.syllabus
  ) {
    throw new Error('All fields (title, description, videoUrl, courseId, syllabus) are required');
  }

  try {
    const existingLessons = await this.lessonRepository.getLessonsByCourseId(lessonData.courseId.toString());

    console.log(
      `Existing lessons for courseId "${lessonData.courseId}":`,
      existingLessons.map((lesson: { title: any; _id: any }) => ({
        title: lesson.title,
        id: lesson._id,
      }))
    );

    const newLesson = await this.lessonRepository.addLesson(lessonData);
    if (!newLesson) {
      throw new Error('Lesson already exists');
    }

    return newLesson;
  } catch (error) {
    console.error('Error in lessonService.addLesson:', error);
    throw error;
  }
}


    async listLesson(courseId: string, page: number, limit: number): Promise<{ lessons: ILesson[]; total: number }> {
      if (!courseId) {
        throw new Error("Course ID is required");
      }
      if (page < 1 || limit < 1) {
        throw new Error("Page and limit must be positive numbers");
      }
    
      try {
        const result = await this.lessonRepository.listLesson(courseId, page, limit);
        return result;
      } catch (error) {
        console.error(`Service error listing lessons for courseId ${courseId}:`, error);
        throw new Error("Failed to list lessons in service");
      }
    }

      async getLesson(lessonId: string): Promise<ILesson | null> {
        const lesson = await this.lessonRepository.getLesson(lessonId);
        if (!lesson) {
          throw new Error("Lesson not found");
        }
        return lesson;
      }


      async editLesson(lessonId: string, lessonData: Partial<ILesson>): Promise<ILesson | null> {
        if (!lessonId) throw new Error("Lesson ID is required");
        if (!lessonData.title || !lessonData.description) {
          throw new Error("Title and description are required");
        }
    
        const updatedLesson = await this.lessonRepository.editLesson(lessonId, lessonData);
        if (!updatedLesson) {
          throw new Error("Lesson not found");
        }
        return updatedLesson;
      }
    
      async deleteLesson(lessonId: string): Promise<boolean> {
        if (!lessonId) throw new Error("Lesson ID is required");
    
        const deleted = await this.lessonRepository.deleteLesson(lessonId);
        if (!deleted) {
          throw new Error("Lesson not found");
        }
        return deleted;
      }
}

export default new LessonService(lessonRepository)