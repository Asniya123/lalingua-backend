import { Request, Response } from "express";

export interface ILanguage{
    name: string;
    imageUrl?: string
}  

export interface ILanguageRepository{
    addLanguage(languageData: ILanguage): Promise<ILanguage | null>
    editLanguage(languageId: string, updateData: Partial<ILanguage>): Promise<ILanguage | null>
    listLanguage(page: number, limit: number): Promise<{languages: ILanguage[], total: number }>
    deleteLanguage(languageId: string): Promise<boolean> 
    getLanguages(): Promise<ILanguage[]>;
}

export interface ILanguageService{
    
    addLanguage(languageData: ILanguage): Promise<ILanguage | null>
    editLanguage(languageId: string, updateData: Partial<ILanguage>): Promise<ILanguage | null>
    listLanguage(page: number, limit: number ): Promise<{languages: ILanguage[], total: number }>
    deleteLanguage(languageId: string): Promise<boolean>
}

export interface ILanguageController{
    addLanguage(req: Request, res: Response): Promise<void>
    editLanguage(req: Request, res: Response): Promise<void>
    listLanguage(req: Request, res: Response): Promise<void>
    deleteLanguage(req: Request, res: Response): Promise<void>
}   

function editLanguage(languageId: any, string: any, updateData: any, arg3: any) {
    throw new Error("Function not implemented.");
}



