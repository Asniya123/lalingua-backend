import { model, Schema } from "mongoose";
const UserLessonCompletionSchema = new Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
        index: true
    },
    lessonId: {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    }
});
UserLessonCompletionSchema.index({ userId: 1, courseId: 1 });
UserLessonCompletionSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });
const UserLessonCompletionModel = model("UserLessonCompletion", UserLessonCompletionSchema);
export default UserLessonCompletionModel;
