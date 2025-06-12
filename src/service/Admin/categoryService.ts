import { ICategory, ICategoryRepository, ICategoryService } from "../../interface/ICategory.js";
import categoryRepository from "../../repositories/admin/categoryRepository.js";


class CategoryService implements ICategoryService {
    private categoryRepository: ICategoryRepository; 
    
    constructor(categoryRepository: ICategoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    async addCategory(categoryData: ICategory): Promise<ICategory | null> {
        if (!categoryData.name || !categoryData.description) {
            throw new Error("Name and description are required fields");
        }

        const exisitingCategory = await this.categoryRepository.addCategory(categoryData)
        if(!exisitingCategory){
            throw new Error('Category already exisits')
        }

        return exisitingCategory
       
    }

    async editCategory(categoryId: string, updateData: Partial<ICategory>): Promise<ICategory | null> {
        if (!categoryId) {
            throw new Error("Category ID is required");
        }

        const updatedCategory = await this.categoryRepository.editCategory(categoryId, updateData);
        if (!updatedCategory) {
            throw new Error("Category not found or update failed");
        }

        return updatedCategory;
    }

    async listCategory(page: number, limit: number, search?: string ): Promise<{ categories: ICategory[], total: number }> {
    try {
        return await this.categoryRepository.listCategory(page, limit, search);
    } catch (error) {
        console.error('Error in CategoryService.listCategory:', error);
        throw new Error('Service failed to fetch categories');
    }
}

    async deleteCategory(categoryId: string): Promise<boolean> {
        return await this.categoryRepository.deleteCategory(categoryId);
    }
    

}


export default new CategoryService(categoryRepository);
