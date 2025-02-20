import { Schema, model, Document } from 'mongoose';
import { IStudent } from '../interface/IStudent.js';



const UserSchema = new Schema<IStudent>({
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
  otp:{
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: true,
  },
  profilePicture: {
    type: String,
    required: false
  },
  dateOfBirth: {
    type: Date,
    required: false,
  },
  is_blocked: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: true
});

const userModel = model<IStudent>('Student', UserSchema);
export default userModel;
