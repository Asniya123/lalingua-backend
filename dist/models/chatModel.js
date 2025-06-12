import mongoose, { model, Schema } from "mongoose";
const ChatSchema = new Schema({
    participants: [{
            type: Schema.Types.ObjectId,
            refPath: "participantsRef",
            required: true,
        }],
    participantsRef: [{
            type: String,
            enum: ["Student", "Tutor"],
            required: true,
        }],
    messages: [{
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: [],
        }],
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: null,
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
// Validate participants and participantsRef length
ChatSchema.pre("validate", function (next) {
    if (this.participants.length !== this.participantsRef.length) {
        return next(new Error("Participants and participantsRef must have the same length"));
    }
    next();
});
// Validate that participants contains valid ObjectIds
ChatSchema.path("participants").validate({
    validator: (arr) => arr.every(id => mongoose.Types.ObjectId.isValid(id)),
    message: "All participants must be valid ObjectIds",
});
// Validate non-empty arrays
ChatSchema.path("participants").validate({
    validator: (arr) => arr.length > 0,
    message: "Participants array must not be empty",
});
ChatSchema.path("participantsRef").validate({
    validator: (arr) => arr.length > 0,
    message: "participantsRef array must not be empty",
});
const chatModel = model("Conversation", ChatSchema);
export default chatModel;
