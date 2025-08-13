import Tutorcontroller from "../../controllers/Tutor/tutorController";
import tutorService from "../../service/Tutor/tutorService";
import {  tutorAuthenticate } from "../../middleware/tutorMiddleware";
import {  Router } from "express";
import CourseController from "../../controllers/Tutor/courseController";
import courseService from "../../service/Tutor/courseService";
import LessonController from "../../controllers/Tutor/lessonController";
import lessonService from "../../service/Tutor/lessonService";
import EnrollmentController from "../../controllers/Tutor/enrolledStudentscontroller";
import enrolledStudentsservice from "../../service/Tutor/enrolledStudentsservice";


const router = Router();

const tutorController = new Tutorcontroller(tutorService);
const courseController = new CourseController(courseService)
const lessonController = new LessonController(lessonService)
const enrollmentController = new EnrollmentController(enrolledStudentsservice)



router.post("/register", tutorController.registerTutor.bind(tutorController));
router.post("/verify-otp", tutorController.verifyOtp.bind(tutorController));
router.post("/resend-otp", tutorController.resendOtp.bind(tutorController));
router.post('/login', tutorController.login.bind(tutorController))
router.post('/forgot-password', tutorController.forgotPassword.bind(tutorController))
router.post('/reset-password', tutorController.resetPassword.bind(tutorController))

router.post('/refresh-token', tutorController.refreshTutorAccessToken.bind(tutorController));

router.get('/getProfile', tutorAuthenticate, tutorController.getTutorProfile.bind(tutorController))
router.put('/editProfile', tutorAuthenticate, tutorController.updateTutorProfile.bind(tutorController))
router.put('/uploadPicture', tutorAuthenticate, tutorController.uploadProfilePicture.bind(tutorController))
router.post('/changePassword', tutorAuthenticate, tutorController.changePassword.bind(tutorController))
router.get('/:tutorId/enrolled-students', tutorAuthenticate, tutorController.getEnrolledStudents.bind(tutorController))

//Course
router.post('/addCourse', tutorAuthenticate, courseController.addCourse.bind(courseController));
router.get('/listCourse',tutorAuthenticate, courseController.listCourses.bind(courseController))
router.get("/course/:courseId",tutorAuthenticate, courseController.getCourse.bind(tutorController));
router.put('/editCourse/:courseId',tutorAuthenticate, courseController.editCourse.bind(courseController));
router.delete('/delete/:courseId',tutorAuthenticate, courseController.deleteCourse.bind(courseController))


//Lesson
router.post('/addLesson/:courseId', lessonController.addLesson.bind(lessonController))
router.get('/listLessons/:courseId', lessonController.listLesson.bind(lessonController))
router.get('/lesson/:lessonId', lessonController.getLesson.bind(lessonController))
router.put("/editLesson/:lessonId", lessonController.editLesson.bind(lessonController)); 
router.delete("/deleteLesson/:lessonId", lessonController.deleteLesson.bind(lessonController)); 


//EnrolledStudents
router.get('/enrolledStudents', tutorAuthenticate, enrollmentController.listEnrolledStudents.bind(enrollmentController))



export default router;
     