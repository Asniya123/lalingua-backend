import { model, Schema } from "mongoose";
const ReviewSchema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    review: {
        type: String,
        required: true,
        trim: true,
    },
}, { timestamps: true });
const reviewModel = model("Review", ReviewSchema);
export default reviewModel;
