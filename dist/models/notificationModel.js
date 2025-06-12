import { model, Schema } from "mongoose";
const NotificationSchema = new Schema({
    heading: {
        type: String,
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
    url: {
        type: String,
    },
    from: {
        type: Schema.Types.ObjectId,
        refPath: "fromModel",
        required: true,
    },
    fromModel: {
        type: String,
        required: true,
        enum: ["User", "Tutor", "Admin"],
    },
    to: {
        type: Schema.Types.ObjectId,
        refPath: "toModel",
    },
    toModel: {
        type: String,
        enum: ["User", "Tutor", "Admin"],
    },
}, {
    timestamps: true,
});
const NotificationModel = model("Notification", NotificationSchema);
export default NotificationModel;
