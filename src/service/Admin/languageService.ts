import { ILanguage, ILanguageRepository, ILanguageService } from "../../interface/ILanguage.js";
import languageRepository from "../../repositories/admin/languageRepository.js";

class LanguageService implements ILanguageService{
    private languageRepository: ILanguageRepository
    constructor(languageRepository: ILanguageRepository){
        this.languageRepository = languageRepository
    }

    async addLanguage(languageData: ILanguage): Promise<ILanguage | null> {
       
        if (!languageData.name) {
          throw new Error('Name is required');
        }
    
        try {
          const existingLanguage = await this.languageRepository.addLanguage(languageData);
          if (!existingLanguage) {
            throw new Error('Language already exists');
          }
          return existingLanguage;
        } catch (error) {
          console.error('Error in languageService.addLanguage:', error);
          throw error;
        }
    }

    async editLanguage(languageId: string, updateData: Partial<ILanguage>): Promise<ILanguage | null> {
        if(languageId){
            throw new Error('Category id is required')
        }

        const updateLanguage = await this.languageRepository.editLanguage(languageId, updateData)
        if(!updateLanguage){
            throw new Error("Language not found")
        }
        return updateLanguage
    }

    async listLanguage(page: number, limit: number, search?: string): Promise<{ languages: ILanguage[]; total: number }> {
    try {
        return await this.languageRepository.listLanguage(page, limit, search);
    } catch (error) {
        console.error('Error in LanguageService.listLanguage:', error);
        throw new Error('Server failed to fetch languages');
    }
}

    async deleteLanguage(languageId: string): Promise<boolean> {
        return await this.languageRepository.deleteLanguage(languageId)
    }
}


export default new LanguageService(languageRepository)