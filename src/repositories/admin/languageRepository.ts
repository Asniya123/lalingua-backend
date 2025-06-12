import { ILanguage, ILanguageRepository } from "../../interface/ILanguage.js";
import languageModel from "../../models/languageModel.js";

class LanguageRepository implements ILanguageRepository{
    async addLanguage(languageData: ILanguage): Promise<ILanguage | null> {
        try {
         
          const existingLanguage = await languageModel.findOne({
            name: { $regex: new RegExp(`^${languageData.name}$`, 'i') }, 
          });
    
          if (existingLanguage) {
            console.log(
              `Language already exists with name "${languageData.name}" (existing: "${existingLanguage.name}")`
            );
            return null; 
          }
    
         
          const newLanguage = await languageModel.create(languageData);
         
          return newLanguage;
        } catch (error) {
          console.error('Error in languageRepository.addLanguage:', error);
          throw new Error('Failed to add language in repository');
        }
      }

    async editLanguage(languageId: string, updateData: Partial<ILanguage>): Promise<ILanguage | null> {
        return await languageModel.findByIdAndUpdate(languageId, updateData, { new: true})
    }

    async listLanguage(page: number, limit: number, search?: string): Promise<{ languages: ILanguage[]; total: number }> {
    try {
        const skip = (page - 1) * limit;

        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        const [languages, total] = await Promise.all([
            languageModel
                .find(query)
                .skip(skip)
                .limit(limit)
                .lean(),
            languageModel.countDocuments(query),
        ]);

        return { languages, total };
    } catch (error) {
        console.error('Error in LanguageRepository.listLanguages:', error);
        throw new Error('Failed to fetch languages from database');
    }
}

    async deleteLanguage(languageId: string): Promise<boolean> {
        const result = await languageModel.findByIdAndDelete(languageId)
        return !! result
    }

    async getLanguages(): Promise<ILanguage[]> {
        return await languageModel.find().select("name imageUrl").exec(); // User-specific list, excluding sensitive fields if any
      }
}

export default new LanguageRepository