var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import languageRepository from "../../repositories/admin/languageRepository.js";
class LanguageService {
    constructor(languageRepository) {
        this.languageRepository = languageRepository;
    }
    addLanguage(languageData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!languageData.name) {
                throw new Error('Name is required');
            }
            try {
                const existingLanguage = yield this.languageRepository.addLanguage(languageData);
                if (!existingLanguage) {
                    throw new Error('Language already exists');
                }
                return existingLanguage;
            }
            catch (error) {
                console.error('Error in languageService.addLanguage:', error);
                throw error;
            }
        });
    }
    editLanguage(languageId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (languageId) {
                throw new Error('Category id is required');
            }
            const updateLanguage = yield this.languageRepository.editLanguage(languageId, updateData);
            if (!updateLanguage) {
                throw new Error("Language not found");
            }
            return updateLanguage;
        });
    }
    listLanguage(page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.languageRepository.listLanguage(page, limit, search);
            }
            catch (error) {
                console.error('Error in LanguageService.listLanguage:', error);
                throw new Error('Server failed to fetch languages');
            }
        });
    }
    deleteLanguage(languageId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.languageRepository.deleteLanguage(languageId);
        });
    }
}
export default new LanguageService(languageRepository);
