import { NextFunction, Request, Response, Router }  from "express";
import StudentController from "../../controllers/Student/studentController.js";
import studentService from "../../service/Student/studentService.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { AuthenticatedRequest } from "../../interface/IStudent.js";



const router = Router()

const studentController = new StudentController(studentService)


router.post('/register', (req:Request, res: Response) => studentController.registerStudent(req, res))
router.post("/verify-otp", studentController.verifyOtp.bind(studentController));
router.post('/resend-otp', studentController.resendOtp.bind(studentController))
router.post('/login', studentController.login.bind(studentController))
router.post('/google', studentController.googlesignIn.bind(studentController))
router.get('/getProfile', authenticate,studentController.getStudentProfile.bind(studentController));
router.put('/editProfile', authenticate, studentController.updateStudentProfile.bind(studentController))

export default router