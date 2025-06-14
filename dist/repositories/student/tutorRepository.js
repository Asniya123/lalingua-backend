var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import tutorModel from "../../models/tutorModel.js";
class TutorRepository {
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return tutorModel.find().exec();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutor = yield tutorModel.findById(id).exec();
                return tutor;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error(`Failed to fetch tutor: ${error.message}`);
                }
                else {
                    throw new Error(`Failed to fetch tutor: ${String(error)}`);
                }
            }
        });
    }
}
export default new TutorRepository();
