import { ICategory, ICategoryRepository } from "../../interface/ICategory.js";
import categoryModel from "../../models/categoryModel.js";

class CategoryRepository implements ICategoryRepository {
    async addCategory(categoryData: ICategory): Promise<ICategory | null> {

        const existingCategory = await categoryModel.findOne({name: categoryData.name})

        if(existingCategory){
            return null
        }
        return await categoryModel.create(categoryData);
    }

    async editCategory(categoryId: string, updateData: Partial<ICategory>): Promise<ICategory | null> {
        return await categoryModel.findByIdAndUpdate(categoryId, updateData, { new: true });
    }

    async listCategory(): Promise<ICategory[]> {
        return await categoryModel.find()
    }

    async deleteCategory(categoryId: string): Promise<boolean> {
        const result = await categoryModel.findByIdAndDelete(categoryId);
        return !!result;
    }
    
}

export default new CategoryRepository;
