import { ITutorController, ITutorService } from "../../interface/ITutor.js";
import { Request, Response } from 'express'
import cloudinary from 'cloudinary'

export default class Tutorcontroller implements ITutorController {
    private tutorService: ITutorService

    constructor(tutorService: ITutorService){
        this.tutorService = tutorService
    }

    async googlesignIn(req: Request, res: Response): Promise<void> {
        try {
          
          const tutorData = req.body;
    
          
          const { tutor, accessToken, refreshToken } = await this.tutorService.googlesignIn(tutorData);
    
         
          res.status(200).json({
            message: 'Google Sign-In successful',
            student: {
              _id: tutor._id,
              name: tutor.name,
              email: tutor.email,
              mobile: tutor.mobile,
            },
            accessToken,
            refreshToken,
          });
        } catch (error: unknown) {
            console.error('Google Sign-In Error:', (error as Error).message);
          
            res.status(500).json({
              message: 'Failed to sign in with Google',
              error: (error as Error).message,
            });
        }
      }

   
    
    async registerTutor(req: Request, res: Response): Promise<void> {
        console.log('Request body:', req.body)
        try {
            const newTutor = await this.tutorService.registerTutor(req.body);
            if (newTutor) {
                res.status(201).json({
                    message: "OTP sent to mail. Please verify your OTP to complete registration",
                    tutor: {
                        id: newTutor._id,
                        name: newTutor.name,
                        email: newTutor.email,
                        mobile: newTutor.mobile,
                    }, 
                });
            }
        } catch (error) {
            console.error("Error during registration:", error); 
            res.status(400).json({
                message: error instanceof Error ? error.message : "Error occurred during registration",
            });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email, otp } = req.body;
            console.log("Received email:", email, "Received otp:", otp); 
            if (!email || !otp) {
                throw new Error('Email and OTP are required');
            
            }

            const isVerified = await this.tutorService.verifyOtp(email, otp);
    
            if (isVerified) {
                res.status(200).json({
                    message: 'OTP verified successfully',
                    tutor: {
                        id: isVerified._id,
                        name: isVerified.name,
                        email: isVerified.email,
                    },
                });
            } else {
                res.status(400).json({ message: 'Invalid or expired OTP' });
            }
        } catch (error) {
            res.status(400).json({
                message: error instanceof Error ? error.message : 'Error occurred during OTP verification',
            });
        }
    }


    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body
            const tutor = await this.tutorService.resendOtp(email)

            if(tutor){
                res.status(200).json({ message: 'OTP resend successfully'})
            }else{
                res.status(400).json({message: 'Failed resend OTP'})
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occured'
            res.status(500).json({ message: errorMessage})
        }
    }


    async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body

        try {
            const {accessToken,refreshToken,tutor} = await this.tutorService.login(email, password)
            res.status(200).json({message: 'login success',accessToken,refreshToken,tutor})
        } catch (error) {
            if(error instanceof Error){
                res.status(404).json({message: error.message || 'Something went wrong'})
            }
            else{
                res.status(500).json({message: 'Invalid server error'})
            }
        }
    }
}