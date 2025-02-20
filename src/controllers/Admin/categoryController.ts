import { ICategory, ICategoryController, ICategoryService } from "../../interface/ICategory.js";
import { Request, Response } from "express";


export default class CategoryController implements ICategoryController {
    private categoryService: ICategoryService;

    constructor(categoryService: ICategoryService) {
        this.categoryService = categoryService;
    }

    async addCategory(req: Request, res: Response):Promise<void>{
        try {
           
            const categoryData = req.body 

            if (!categoryData || !categoryData.name || !categoryData.description) {
               res.status(400).json({ error: "Name and description are required" });
               return 
            }

            const newCategory = await this.categoryService.addCategory(categoryData);

             res.status(201).json({
                message: "Category added successfully",
                category: newCategory,
            });
            return 
        } catch (error: any) {
             res.status(400).json({ error: error.message });
             return
        }
    }

    async editCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;
            const updateData = req.body as Partial<ICategory>;

            if (!categoryId) {
                 res.status(400).json({ error: "Category ID is required" });
                 return 
            }

            const updatedCategory = await this.categoryService.editCategory(categoryId, updateData);

            if (!updatedCategory) {
                res.status(404).json({ message: "Category not found" });
                return 
            }

             res.status(200).json({
                message: "Category updated successfully",
                category: updatedCategory,
            });
            return 
        } catch (error: any) {
             res.status(400).json({ error: error.message });
             return 
        }
    }

    async listCategory(req: Request, res: Response): Promise<void> {
        try {
            const categories = await this.categoryService.listCategory()
            res.status(200).json({
                message: 'Categories retrieved successfully',
                categories
            })
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }        
    }

    async deleteCategory(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.params;
    
            if (!categoryId) {
                res.status(400).json({ success: false, message: "Category ID is required" });
                return;
            }
    
            const isDeleted = await this.categoryService.deleteCategory(categoryId);
    
            if (!isDeleted) {
                res.status(404).json({ success: false, message: "Category not found" });
                return;
            }
    
            res.status(200).json({ success: true, message: "Category deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
} 
