import { model, Schema } from "mongoose";
const LanguageSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String
    }
});
const languageModel = model('Language', LanguageSchema);
export default languageModel;
