import { model, Schema } from "mongoose";
import { IEnrollment } from "../interface/IEnrollment.js";


const EnrollmentSchema: Schema = new Schema(
    {
      name: {
        type: String,
        required: true
      },
      courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
      tutorId: {
        type: Schema.Types.ObjectId,
        ref:'Tutor',
        required: true
      },
      enrolledDate: {
    type: Date,
    default: Date.now,
  },
  progress: {
    type: Number,
    default: 0
  },
}, { timestamps: true });


const EnrollmentModel = model<IEnrollment>('Enrollment', EnrollmentSchema);
export default EnrollmentModel;