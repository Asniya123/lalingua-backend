import { Schema, model } from "mongoose";
import { ITutor } from "../interface/ITutor.js";

const TutorSchema = new Schema<ITutor>(
  {
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
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      // required: true,
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
    is_blocked: {
      type: Boolean,
      default: false,
    },
    documents: {
      type: String,
    },
    profilePicture: {
      type: String,
      required: false
    },
    qualification: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    },
    experience: {
      type: String,
      default: ''
    },
    specialization: {
      type: String,
      default: ''
    },
    dateOfBirth: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "rejected"],
    },
   
  },
  {
    timestamps: true,
  }
);

const tutorModel = model<ITutor>("Tutor", TutorSchema);
export default tutorModel;
