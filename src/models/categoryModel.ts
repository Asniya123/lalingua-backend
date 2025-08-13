import { model, Schema } from "mongoose";
import { ICategory } from "../interface/ICategory";



const CategorySchema = new Schema<ICategory>({
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
})

const categoryModel = model<ICategory>('Category', CategorySchema)
export default categoryModel