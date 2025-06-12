var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class LanguageController {
    constructor(languageService) {
        this.languageService = languageService;
    }
    addLanguage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, imageUrl } = req.body;
                if (!name) {
                    res.status(400).json({ error: 'Name is required' });
                    return;
                }
                const languageData = { name, imageUrl: imageUrl || '' };
                const newLanguage = yield this.languageService.addLanguage(languageData);
                res.status(201).json({
                    message: 'Language added successfully',
                    language: newLanguage,
                });
            }
            catch (error) {
                console.error('Controller error in addLanguage:', error);
                res.status(400).json({ error: error.message });
            }
        });
    }
    editLanguage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { languageId } = req.params;
                const updateData = req.body;
                if (!languageId) {
                    res.status(400).json({ error: "Language ID is required" });
                    return;
                }
                const updatedLanguage = yield this.languageService.editLanguage(languageId, updateData);
                if (!updatedLanguage) {
                    res.status(404).json({ message: "Language not found" });
                    return;
                }
                res.status(200).json({
                    message: "Language updated successfully",
                    language: updatedLanguage,
                });
                return;
            }
            catch (error) {
                res.status(400).json({ error: error.message });
                return;
            }
        });
    }
    listLanguage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 5;
                const search = req.query.search || '';
                if (page < 1 || limit < 1) {
                    res.status(400).json({
                        success: 'Invalid pagination parameters. Page and limit must be positive numbers.',
                    });
                    return;
                }
                const { languages, total } = yield this.languageService.listLanguage(page, limit, search);
                res.status(200).json({
                    success: true,
                    message: 'Languages retrieved successfully',
                    data: {
                        languages,
                        pagination: {
                            currentPage: page,
                            totalPage: Math.ceil(total / limit),
                            itemPerPage: limit,
                            totalItems: total,
                        },
                    },
                    total,
                });
            }
            catch (error) {
                console.error('Error in LanguageController.listLanguage:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error',
                    items: error.message,
                });
            }
        });
    }
    deleteLanguage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { languageId } = req.params;
                if (!languageId) {
                    res.status(400).json({ success: false, message: "Language ID is required" });
                    return;
                }
                const isDeleted = yield this.languageService.deleteLanguage(languageId);
                if (!isDeleted) {
                    res.status(404).json({ success: false, message: "Language not found" });
                    return;
                }
                res.status(200).json({ success: true, message: "Language deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });
    }
}
