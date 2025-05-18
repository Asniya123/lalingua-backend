import { model, Schema } from "mongoose";
import { ILesson } from "../interface/ILesson.js";

const LessonSchema = new Schema<ILesson>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  courseId: { 
       type: Schema.Types.ObjectId, 
       ref: "Course", 
       required: true 
  },
  introVideoUrl: {
    type: String,
    required: true
  },
  syllabus: {
      title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100,
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500,
      },
  },
});

const LessonModel = model<ILesson>("Lesson", LessonSchema);
export default LessonModel;
