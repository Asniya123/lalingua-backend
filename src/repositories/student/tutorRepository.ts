import { ISTutorRepository, ITutor } from "../../interface/ITutor";
import tutorModel from "../../models/tutorModel";

class TutorRepository implements ISTutorRepository{

    async  findAll(): Promise<ITutor[]>{
        return tutorModel.find().exec()
    }

    async findById(id: string): Promise<ITutor | null> {
        try {
            const tutor = await tutorModel.findById(id).exec()
            return tutor
        }catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch tutor: ${error.message}`);
            } else {
                throw new Error(`Failed to fetch tutor: ${String(error)}`);
            }
        }
        
    }
}


export default new TutorRepository()