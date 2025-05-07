import { Request, Response } from "express";

export interface ICategory{
    name: string;
    description?: string
    imageUrl?: string
}  

export interface ICategoryRepository{
    addCategory(categoryData: ICategory): Promise<ICategory | null>
    editCategory(categoryId: string, updateData: Partial<ICategory>): Promise<ICategory | null>
    listCategory(page: number, limit: number): Promise<{ categories: ICategory[], total: number }> 
    listAllCategories(): Promise<ICategory[]>
    deleteCategory(categoryId: string): Promise<boolean> 
}

export interface ICategoryService{
    
    addCategory(categoryData: ICategory): Promise<ICategory | null>
    editCategory(categoryId: string, updateData: Partial<ICategory>): Promise<ICategory | null>
    listCategory(page: number, limit: number ): Promise<{ categories: ICategory[], total: number }>
    deleteCategory(categoryId: string): Promise<boolean>
}

export interface ICategoryController{
    addCategory(req: Request, res: Response): Promise<void>
    editCategory(req: Request, res: Response): Promise<void>
    listCategory(req: Request, res: Response): Promise<void>
    deleteCategory(req: Request, res: Response): Promise<void>
}   