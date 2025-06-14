import { model, Schema } from "mongoose";
const MessageSchema = new Schema({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    senderId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    message_type: {
        type: String,
        required: true,
    },
    message_time: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
const MessageModel = model("Message", MessageSchema);
export default MessageModel;
