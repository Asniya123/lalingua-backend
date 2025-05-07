import { Request, Response } from "express";
import {
    ILanguage,
  ILanguageController,
  ILanguageService,
} from "../../interface/ILanguage.js";

export default class LanguageController implements ILanguageController {
  private languageService: ILanguageService;
  constructor(languageService: ILanguageService) {
    this.languageService = languageService;
  }

  async addLanguage(req: Request, res: Response): Promise<void> {
    try {
      const { name, imageUrl } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const languageData: ILanguage = { name, imageUrl: imageUrl || '' };
      const newLanguage = await this.languageService.addLanguage(languageData);

      res.status(201).json({
        message: 'Language added successfully',
        language: newLanguage,
      });
    } catch (error: any) {
      console.error('Controller error in addLanguage:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async editLanguage(req: Request, res: Response): Promise<void> {
    try {
      const { languageId } = req.params;
      const updateData = req.body as Partial<ILanguage>;

      if (!languageId) {
        res.status(400).json({ error: "Language ID is required" });
        return;
      }

      const updatedLanguage = await this.languageService.editLanguage(
        languageId,
        updateData
      );

      if (!updatedLanguage) {
        res.status(404).json({ message: "Language not found" });
        return;
      }

      res.status(200).json({
        message: "Language updated successfully",
        language: updatedLanguage,
      });
      return;
    } catch (error: any) {
      res.status(400).json({ error: error.message });
      return;
    }
  }



  async listLanguage(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
  
      if (page < 1 || limit < 1) {
        res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters. Page and limit must be positive numbers.',
        });
        return;
      }
      const { languages, total } = await this.languageService.listLanguage(page, limit);
      res.status(200).json({
        success: true,
        message: 'Languages retrieved successfully',
        data: {
          languages,
          pagination: {
            currentPage: page,
            totalPage: Math.ceil(total / limit),
            itemPerPage: limit,
            totalItems: total // Add this
          },
        },
        total 
      });
    } catch (error) {
      console.error('Error in LanguageController.listLanguage:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || 'Internal server error',
      });
    }
  }

  async deleteLanguage(req: Request, res: Response): Promise<void> {
    try {
        const { languageId } = req.params;

        if (!languageId) {
            res.status(400).json({ success: false, message: "Language ID is required" });
            return;
        }

        const isDeleted = await this.languageService.deleteLanguage(languageId);

        if (!isDeleted) {
            res.status(404).json({ success: false, message: "Language not found" });
            return;
        }

        res.status(200).json({ success: true, message: "Language deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }

  }
}
