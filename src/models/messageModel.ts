import { model, Schema } from "mongoose";
import { IMessage } from "../interface/IConversation.js";


const MessageSchema = new Schema<IMessage>({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    message_type: {
        type: String,
        required: true
    },
    message_time: {
        type: Date,
        default: new Date()
    }
}, {timestamps: true})

const MessageModel = model<IMessage>("Message", MessageSchema);
export default MessageModel;