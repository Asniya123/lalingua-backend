import { model, Schema } from "mongoose";
import { IEnrollment } from "../interface/IEnrollment.js";


const EnrollmentSchema: Schema = new Schema(
    {
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
    }
  );


const EnrollmentModel = model<IEnrollment>('Enrollment', EnrollmentSchema);
export default EnrollmentModel;