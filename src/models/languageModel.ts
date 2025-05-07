import { model, Schema } from "mongoose";
import { ILanguage } from "../interface/ILanguage.js";



const LanguageSchema = new Schema<ILanguage>({
    name: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String
    }
})

const languageModel = model<ILanguage>('Language', LanguageSchema)
export default languageModel