import { model, Schema } from "mongoose";
const EnrollmentSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    completedLessons: [{
            type: Schema.Types.ObjectId,
            ref: "Lessons"
        }],
    isCourseCompleted: {
        type: Boolean,
        default: false
    },
});
const EnrollmentModel = model('Enrollment', EnrollmentSchema);
export default EnrollmentModel;
