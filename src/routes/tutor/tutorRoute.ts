import Tutorcontroller from "../../controllers/Tutor/tutorController.js";
import tutorService from "../../service/Tutor/tutorService.js";
import {  Router } from "express";

const router = Router();

const tutorController = new Tutorcontroller(tutorService);

router.post("/register", tutorController.registerTutor.bind(tutorController));
router.post("/verify-otp", tutorController.verifyOtp.bind(tutorController));
router.post("/resend-otp", tutorController.resendOtp.bind(tutorController));
router.post('/login', tutorController.login.bind(tutorController))

export default router;
