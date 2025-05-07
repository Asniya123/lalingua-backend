import { ISTutorRepository, ISTutorService, ITutor } from "../../interface/ITutor.js";
import tutorRepository from "../../repositories/student/tutorRepository.js";

export class TutorService implements ISTutorService{
    private tutorRepository: ISTutorRepository;

    constructor(
        tutorRepository: ISTutorRepository
    ){
        this.tutorRepository = tutorRepository
    }


    async  getAllTutors(): Promise<ITutor[]> {
        try{
            const tutors = await tutorRepository.findAll()
            return tutors
        }catch(error){
            throw new Error('Failed to fetch tutors from database')
        }
    }


    async  getTutorById(id: string): Promise<{ success: boolean; data: any; }> {
        try {
            const tutor = await tutorRepository.findById(id)
            if(!tutor){
                return {
                    success: false,
                    data: null,
                }
            }
            return {
                success: true,
                data: tutor
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch tutor: ${error.message}`);
            } else {
                throw new Error(`Failed to fetch tutor: ${String(error)}`);
            }
        }
    }
}


export default new TutorService(tutorRepository)