import { model, Schema } from 'mongoose';
import { IPurchase } from '../interface/IPurchase'

const PurchaseSchema = new Schema<IPurchase>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  courseTitle: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['completed', 'refund', 'pending', 'failed'],
    default: 'completed',
  },
  tutor: {
    type: Schema.Types.ObjectId,
    ref: 'Tutor',
  },
});


// PurchaseSchema.set('toJSON', {
//   transform: (doc, ret) => {
//     ret._id = ret._id.toString();
//     ret.userId = ret.userId.toString();
//     ret.courseId = ret.courseId.toString();
//     if (ret.tutor && ret.tutor._id) {
//       ret.tutor._id = ret.tutor._id.toString();
//     }
//     return ret;
//   },
// });

const PurchaseModel = model<IPurchase>('Purchase', PurchaseSchema);
export default PurchaseModel;