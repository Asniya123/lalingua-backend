import { AuthenticatedRequest, IStudentController, IStudentService } from "../../interface/IStudent.js";
import { Request, Response } from 'express';



export default class StudentController implements IStudentController {
    private studentService: IStudentService;

    constructor(studentService: IStudentService) {
        this.studentService = studentService;
    }

    async registerStudent(req: Request, res: Response): Promise<void> {
        try {
            const newStudent = await this.studentService.registerStudent(req.body);
            if (newStudent) {
                res.status(201).json({
                    message: "OTP sent to mail. Please verify your OTP to complete registration",
                    student: {
                        id: newStudent._id,
                        name: newStudent.name,
                        email: newStudent.email,
                        mobile: newStudent.mobile,
                    },
                });
            }
        } catch (error) {
            res.status(400).json({
                message: error instanceof Error ? error.message : "Error occurred during registration",
            });
        }
    }


    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
          const { email, otp } = req.body; 
      
          if (!email || !otp) {
            throw new Error("Email and OTP are required");
          }
      
          const isVerified = await this.studentService.verifyOtp(email, otp);
          if (isVerified) {
            res.status(200).json({
              message: "OTP verified successfully",
              student: {
                id: isVerified._id,
                name: isVerified.name,
                email: isVerified.email,
              },
            });
          } else {
            res.status(400).json({ message: "Invalid or expired OTP" });
          }
        } catch (error) {
          res.status(400).json({
            message: error instanceof Error ? error.message : "Error occurred during OTP verification",
          });
        }
      }
      
    
    async resendOtp(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            const student = await this.studentService.resendOtp(email);

            if (student) {
                res.status(200).json({ message: "OTP resent successfully" });
            } else {
                res.status(400).json({ message: "Failed to resend OTP" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            res.status(500).json({ message: errorMessage });
        }
    }


    async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
    
        try {
            const login = await this.studentService.login(email, password);
            res.status(200).json({ message: 'Login success', login });
        }  catch (error: any) {
            if (error.status === 403) {
                res.status(403).json({ status: 403, message: error.message });
            } else if (error instanceof Error) {
                res.status(401).json({ message: error.message || 'Something went wrong.' });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
        
    }  
    
    

    async googlesignIn(req: Request, res: Response): Promise<void> {
        try {
          
          const studentData = req.body;
    
          
          const { student, accessToken, refreshToken } = await this.studentService.googlesignIn(studentData);
    
         
          res.status(200).json({
            message: 'Google Sign-In successful',
            student: {
              _id: student._id,
              name: student.name,
              email: student.email,
              mobile: student.mobile,
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

    async getStudentProfile(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user || !req.user._id) {
                res.status(401).json({ message: "Unauthorized access" });
                return;
            }
    
            const studentId = req.user._id;
            const student = await this.studentService.getStudentProfile(studentId);
    
            if (!student) {
                res.status(404).json({ message: "Student not found" });
                return;
            }
    
            res.status(200).json(student);
        } catch (error) {
            console.error("Error fetching student profile:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
    
    async updateStudentProfile(req:Request, res: Response): Promise<void> {
        try {
            if (!req.user || !req.user._id) {
                res.status(401).json({ message: "Unauthorized access" });
                return;
            }
    
            const studentId = req.user._id;
            const { name, email, phone } = req.body;
    
            if (!name || !email || !phone) {
                res.status(400).json({ message: "All fields are required" });
                return;
            }
    
            const updatedStudent = await this.studentService.updateStudentProfile(studentId, {
                name,
                email,
                phone,
            });
    
            if (!updatedStudent) {
                res.status(404).json({ message: "Failed to update profile" });
                return;
            }
    
            res.status(200).json({ message: "Profile updated successfully", student: updatedStudent });
        } catch (error) {
            console.error("Error updating student profile:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
    
}
    

