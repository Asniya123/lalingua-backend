import { model, Schema } from "mongoose";
// import { IEnrollment } from "../interface/IEnrollment.js";
const EnrollmentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    pricePaid: {
        type: Number,
        required: true,
        min: 0,
    },
    enrolledDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["Active", "Cancelled", "Expired"],
        default: "Active",
    },
}, { timestamps: true });
const EnrollmentModel = model('Enrollment', EnrollmentSchema);
export default EnrollmentModel;
