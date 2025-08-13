import { ILesson, ILessonRepository, ILessonInput } from "../../interface/ILesson";
import LessonModel from "../../models/lessonModel";

class LessonRepository implements ILessonRepository {
  async addLesson(lessonData: ILessonInput): Promise<ILesson | null> {
    try {
      const existingLesson = await LessonModel.findOne({ title: lessonData.title, courseId: lessonData.courseId });
      if (existingLesson) return null;

      const newLesson = new LessonModel(lessonData);
      await newLesson.save()
      return newLesson.toObject() as ILesson
    } catch (error) {
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }


  async getLessonsByCourseId(courseId: string): Promise<ILesson[]> {
    try {
      const lessons = await LessonModel.find({ courseId });
      return lessons.map((lesson) => lesson.toObject() as ILesson);
    } catch (error) {
      console.error('Error in lessonRepository.getLessonsByCourseId:', error);
      throw new Error('Failed to fetch lessons');
    }
  }

  async listLesson(courseId: string, page: number, limit: number): Promise<{ lessons: ILesson[]; total: number }> {
    const skip = (page - 1) * limit;
    const lessons = await LessonModel.find({ courseId })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await LessonModel.countDocuments({ courseId });
    return { lessons, total }
  }


  async getLesson(lessonId: string): Promise<ILesson | null> {
    try {
      const lesson = await LessonModel.findById(lessonId).exec();
      return lesson; 
    } catch (error) {
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async editLesson(lessonId: string, lessonData: Partial<ILesson>): Promise<ILesson | null> {
    try {
      const updatedLesson = await LessonModel.findByIdAndUpdate(
        lessonId,
        { $set: lessonData },
        { new: true, runValidators: true }
      ).exec();
      return updatedLesson;
    } catch (error) {
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async deleteLesson(lessonId: string): Promise<boolean> {
    try {
      const result = await LessonModel.findByIdAndDelete(lessonId).exec();
      return !!result;
    } catch (error) {
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  async courseLesson(courseId:string):Promise<ILesson[]>{
    try {
      const lesson=await LessonModel.find({courseId})
      return lesson
    } catch (error) {
      throw new Error(`Database error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

export default new LessonRepository();