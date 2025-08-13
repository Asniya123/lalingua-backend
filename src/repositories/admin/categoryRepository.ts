import { ICategory, ICategoryRepository } from "../../interface/ICategory";
import categoryModel from "../../models/categoryModel";

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

    async listCategory(page: number, limit: number, search?: string ): Promise<{ categories: ICategory[], total: number }> {
    try {
        const skip = (page - 1) * limit;

        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ],
            }
            : {};

        const [categories, total] = await Promise.all([
            categoryModel
                .find(query)
                .skip(skip)
                .limit(limit)
                .lean(),
            categoryModel.countDocuments(query),
        ]);

        return {
            categories,
            total,
        };
    } catch (error) {
        console.error('Error in CategoryRepository.listCategory:', error);
        throw new Error('Failed to fetch categories from database');
    }
}
    async listAllCategories(): Promise<ICategory[]> {
        return await categoryModel.find().exec(); 
      }

    async deleteCategory(categoryId: string): Promise<boolean> {
        const result = await categoryModel.findByIdAndDelete(categoryId);
        return !!result;
    }
  
    
}

export default new CategoryRepository;
