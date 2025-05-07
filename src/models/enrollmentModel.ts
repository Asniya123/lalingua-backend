import { model, Schema } from "mongoose";
import { IEnrollment } from "../interface/IEnrollment.js";

const EnrollmentSchema = new Schema<IEnrollment>({
    userId: {
        type: String,
        required: true,
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    enrolledAt: {
        type: Date,
        default: Date.now,
    },
    progress: {
        type: Number,
        default: 0,
    }
});


const EnrollmentModel = model<IEnrollment>('Enrollment', EnrollmentSchema);
export default EnrollmentModel;