var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class CategoryController {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    addCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const categoryData = req.body;
                if (!categoryData || !categoryData.name || !categoryData.description) {
                    res.status(400).json({ error: "Name and description are required" });
                    return;
                }
                const newCategory = yield this.categoryService.addCategory(categoryData);
                res.status(201).json({
                    message: "Category added successfully",
                    category: newCategory,
                });
                return;
            }
            catch (error) {
                res.status(400).json({ error: error.message });
                return;
            }
        });
    }
    editCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { categoryId } = req.params;
                const updateData = req.body;
                if (!categoryId) {
                    res.status(400).json({ error: "Category ID is required" });
                    return;
                }
                const updatedCategory = yield this.categoryService.editCategory(categoryId, updateData);
                if (!updatedCategory) {
                    res.status(404).json({ message: "Category not found" });
                    return;
                }
                res.status(200).json({
                    message: "Category updated successfully",
                    category: updatedCategory,
                });
                return;
            }
            catch (error) {
                res.status(400).json({ error: error.message });
                return;
            }
        });
    }
    listCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 5;
                const search = req.query.search || '';
                if (page < 1 || limit < 1) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid pagination parameters. Page and limit must be positive numbers.',
                    });
                    return;
                }
                const { categories, total } = yield this.categoryService.listCategory(page, limit, search);
                res.status(200).json({
                    success: true,
                    message: 'Categories retrieved successfully',
                    data: {
                        categories,
                        pagination: {
                            currentPage: page,
                            totalPages: Math.ceil(total / limit),
                            totalItems: total,
                            itemsPerPage: limit,
                        },
                    },
                });
            }
            catch (error) {
                console.error('Error in CategoryController.listCategory:', error);
                res.status(500).json({
                    success: false,
                    error: error.message || 'Internal server error',
                });
            }
        });
    }
    deleteCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { categoryId } = req.params;
                if (!categoryId) {
                    res.status(400).json({ success: false, message: "Category ID is required" });
                    return;
                }
                const isDeleted = yield this.categoryService.deleteCategory(categoryId);
                if (!isDeleted) {
                    res.status(404).json({ success: false, message: "Category not found" });
                    return;
                }
                res.status(200).json({ success: true, message: "Category deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });
    }
}
