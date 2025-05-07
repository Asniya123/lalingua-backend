import { ISTutorController, ISTutorService } from "../../interface/ITutor.js";
import { Request, Response } from "express";


export default class TutorController implements ISTutorController{
    private tutorService: ISTutorService

    constructor(tutorService: ISTutorService){
        this.tutorService = tutorService
    }

    async getAllTutors(req: Request, res: Response): Promise<void> {
        try {
          const tutors = await this.tutorService.getAllTutors();
          res.status(200).json(tutors);
        } catch (error: any) {
          res.status(500).json({ message: error.message || 'Failed to fetch tutors' });
        }
    }

    async getTutorById(req: Request, res: Response): Promise<void> {
      try {
          const { tutorId } = req.params;  
          if (!tutorId) {
              res.status(400).json({
                  success: false,
                  message: 'Tutor Id is required'
              });
              return;
          }
  
          const result = await this.tutorService.getTutorById(tutorId); 
  
          if (!result.success) {
              res.status(404).json({
                  success: false,
                  message: 'Tutor not found',
              });
              return;
          }
  
          res.status(200).json(result);
      } catch (error) {
          const err = error as Error;
          res.status(500).json({
              success: false,
              message: err.message || 'Internal server error'
          });
      }
  }
  
}