var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import tutorRepository from "../../repositories/student/tutorRepository.js";
export class TutorService {
    constructor(tutorRepository) {
        this.tutorRepository = tutorRepository;
    }
    getAllTutors() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutors = yield tutorRepository.findAll();
                return tutors;
            }
            catch (error) {
                throw new Error('Failed to fetch tutors from database');
            }
        });
    }
    getTutorById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tutor = yield tutorRepository.findById(id);
                if (!tutor) {
                    return {
                        success: false,
                        data: null,
                    };
                }
                return {
                    success: true,
                    data: tutor
                };
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
export default new TutorService(tutorRepository);
