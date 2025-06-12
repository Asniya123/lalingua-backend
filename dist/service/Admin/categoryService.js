var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import categoryRepository from "../../repositories/admin/categoryRepository.js";
class CategoryService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    addCategory(categoryData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!categoryData.name || !categoryData.description) {
                throw new Error("Name and description are required fields");
            }
            const exisitingCategory = yield this.categoryRepository.addCategory(categoryData);
            if (!exisitingCategory) {
                throw new Error('Category already exisits');
            }
            return exisitingCategory;
        });
    }
    editCategory(categoryId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!categoryId) {
                throw new Error("Category ID is required");
            }
            const updatedCategory = yield this.categoryRepository.editCategory(categoryId, updateData);
            if (!updatedCategory) {
                throw new Error("Category not found or update failed");
            }
            return updatedCategory;
        });
    }
    listCategory(page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.categoryRepository.listCategory(page, limit, search);
            }
            catch (error) {
                console.error('Error in CategoryService.listCategory:', error);
                throw new Error('Service failed to fetch categories');
            }
        });
    }
    deleteCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.categoryRepository.deleteCategory(categoryId);
        });
    }
}
export default new CategoryService(categoryRepository);
