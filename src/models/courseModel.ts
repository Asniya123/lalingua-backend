import { model, Schema } from 'mongoose';
import { ICourse } from '../interface/ICourse';

const CourseSchema = new Schema<ICourse>(
  {
    courseTitle: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    language: {
      type: Schema.Types.ObjectId,
      ref: 'Language',
      required: true,
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    buyCount: {
      type: Number,
      default: 0,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    lessons: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const CourseModel = model<ICourse>('Course', CourseSchema);
export default CourseModel;