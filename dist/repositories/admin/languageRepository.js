var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import languageModel from "../../models/languageModel.js";
class LanguageRepository {
    addLanguage(languageData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingLanguage = yield languageModel.findOne({
                    name: { $regex: new RegExp(`^${languageData.name}$`, 'i') },
                });
                if (existingLanguage) {
                    console.log(`Language already exists with name "${languageData.name}" (existing: "${existingLanguage.name}")`);
                    return null;
                }
                const newLanguage = yield languageModel.create(languageData);
                return newLanguage;
            }
            catch (error) {
                console.error('Error in languageRepository.addLanguage:', error);
                throw new Error('Failed to add language in repository');
            }
        });
    }
    editLanguage(languageId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield languageModel.findByIdAndUpdate(languageId, updateData, { new: true });
        });
    }
    listLanguage(page, limit, search) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const query = search
                    ? { name: { $regex: search, $options: 'i' } }
                    : {};
                const [languages, total] = yield Promise.all([
                    languageModel
                        .find(query)
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    languageModel.countDocuments(query),
                ]);
                return { languages, total };
            }
            catch (error) {
                console.error('Error in LanguageRepository.listLanguages:', error);
                throw new Error('Failed to fetch languages from database');
            }
        });
    }
    deleteLanguage(languageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield languageModel.findByIdAndDelete(languageId);
            return !!result;
        });
    }
    getLanguages() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield languageModel.find().select("name imageUrl").exec(); // User-specific list, excluding sensitive fields if any
        });
    }
}
export default new LanguageRepository;
