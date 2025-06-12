import { model, Schema } from "mongoose";
const LessonSchema = new Schema({
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
const LessonModel = model("Lesson", LessonSchema);
export default LessonModel;
