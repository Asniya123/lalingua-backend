import { model, Schema } from "mongoose";
const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String
    }
});
const categoryModel = model('Category', CategorySchema);
export default categoryModel;
