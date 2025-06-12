var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import categoryModel from "../../models/categoryModel.js";
class CategoryRepository {
    addCategory(categoryData) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingCategory = yield categoryModel.findOne({ name: categoryData.name });
            if (existingCategory) {
                return null;
            }
            return yield categoryModel.create(categoryData);
        });
    }
    editCategory(categoryId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield categoryModel.findByIdAndUpdate(categoryId, updateData, { new: true });
        });
    }
    listCategory(page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const [categories, total] = yield Promise.all([
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
            }
            catch (error) {
                console.error('Error in CategoryRepository.listCategory:', error);
                throw new Error('Failed to fetch categories from database');
            }
        });
    }
    listAllCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield categoryModel.find().exec();
        });
    }
    deleteCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield categoryModel.findByIdAndDelete(categoryId);
            return !!result;
        });
    }
}
export default new CategoryRepository;
