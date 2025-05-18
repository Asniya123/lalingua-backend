import mongoose, { model, Schema } from "mongoose"; 
import { IConversation } from "../interface/IConversation.js";


const ChatSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    refPath: 'participantsRef',
    required: true,
  }],
  participantsRef: [{
    type: String,
    enum: ['Student', 'Tutor'],
    required: true,
  }], 
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message',
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  name: {
    type: String,
    default: "Unknown",
  },
  profilePicture: {
    type: String,
    default: null,
  },
}, { timestamps: true });


ChatSchema.pre('validate', function (next) {
  if (this.participants.length !== this.participantsRef.length) {
    return next(new Error('Participants and participantsRef must have the same length'));
  }
  next();
});

ChatSchema.path('participants').validate({
  validator: (arr: mongoose.Types.ObjectId[]) => arr.length > 0,
  message: "Participants array must not be empty",
});


ChatSchema.path('participantsRef').validate({
  validator: (arr: string[]) => arr.length > 0,
  message: "participantsRef array must not be empty",
});

const chatModel = model<IConversation>("Conversation", ChatSchema);
export default chatModel;