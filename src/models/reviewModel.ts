import { model, Schema } from "mongoose";
import { IReview } from "../interface/IReview.js";

const ReviewSchema = new Schema<IReview>({
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
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

const reviewModel = model<IReview>("Review", ReviewSchema)
export default reviewModel