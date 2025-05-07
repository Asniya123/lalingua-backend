import { Schema, model, Document } from 'mongoose';
import { IStudent, IEnrollment } from '../interface/IStudent.js';
import bcrypt from "bcrypt";


const UserSchema = new Schema<IStudent & { enrollments: IEnrollment[] }>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: Number,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  expiresAt: {
    type: Date,
    required: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: true,
  },
  profilePicture: {
    type: String,
    required: false,
  },
  dateOfBirth: {
    type: Date,
    required: false,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  enrollments: [{
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const userModel = model<IStudent & { enrollments: IEnrollment[] }>('Student', UserSchema);
export default userModel;