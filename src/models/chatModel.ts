import { model, Mongoose, Schema } from "mongoose";
import { IConversation } from "../interface/IConversation.js";

const ChatSchema = new Schema<IConversation>({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    {
        tupe: Schema.Types.ObjectId,
        ref: "Tutor",
        required: true
    }
],
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
        default: "Unknown"
    },
    profilePicture: {
        type: String,
        default: null
    }
},{timestamps:  true})

const chatModel = model<IConversation>("Conversation", ChatSchema);
export default chatModel;