import { Router } from "express";
import StudentController from "../../controllers/Student/studentController.js";
import studentService from "../../service/Student/studentService.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import CourseController from "../../controllers/Student/courseController.js";
import courseService from "../../service/Student/courseService.js";
import tutorService from "../../service/Student/tutorService.js";
import TutorController from "../../controllers/Student/tutorController.js";
import WalletController from "../../controllers/Student/walletController.js";
import walletService from "../../service/Student/walletService.js";
import NotificationController from "../../controllers/Socket/notificationController.js";
import notificationService from "../../service/UseCase/notificationService.js";
import ReviewController from "../../controllers/Student/reviewController.js";
import reviewService from "../../service/Student/reviewService.js";
const router = Router();
const studentController = new StudentController(studentService);
router.post('/register', (req, res) => studentController.registerStudent(req, res));
router.post("/verify-otp", studentController.verifyOtp.bind(studentController));
router.post('/resend-otp', studentController.resendOtp.bind(studentController));
router.post('/login', studentController.login.bind(studentController));
router.post('/google', studentController.googlesignIn.bind(studentController));
router.post('/forgot-password', studentController.forgotPassword.bind(studentController));
router.post('/reset-password', studentController.resetPassword.bind(studentController));
router.get('/getProfile', authenticate, studentController.getStudentProfile.bind(studentController));
router.put('/editProfile', authenticate, studentController.updateStudentProfile.bind(studentController));
router.put('/uploadPicture', authenticate, studentController.uploadProfilePicture.bind(studentController));
router.post('/changePassword', authenticate, studentController.changePassword.bind(studentController));
//Course
const typedCourseService = courseService;
const courseController = new CourseController(typedCourseService, walletService);
router.get('/courses', authenticate, courseController.getCourses.bind(courseController));
router.get('/courseDetail/:courseId', authenticate, courseController.getCourseById.bind(courseController));
//Language
router.get('/languages', authenticate, studentController.getLanguages.bind(studentController));
//Payment
router.post('/courseOrder', authenticate, courseController.createOrder.bind(courseController));
router.post('/enrollCourse', authenticate, courseController.enrollCourse.bind(courseController));
//CourseEnrollement
router.get('/enrollments/:userId', authenticate, courseController.getEnrolledCourses.bind(courseController));
router.get('/listLessons/:courseId', authenticate, courseController.listLessons.bind(courseController));
router.get('/:courseId/completed-lessons', authenticate, courseController.getCompletedLessons.bind(courseController));
router.post('/:courseId/lessons/:lessonId/complete', authenticate, courseController.completeLesson.bind(courseController));
router.post('/:courseId/complete', authenticate, courseController.markCourseCompleted.bind(courseController));
router.delete("/enrollments/:userId/:courseId", authenticate, courseController.cancelEnrollment.bind(courseController));
//Tutor
const tutorController = new TutorController(tutorService);
router.get('/tutors', authenticate, tutorController.getAllTutors.bind(tutorController));
router.get('/tutors/:tutorId', authenticate, tutorController.getTutorById.bind(tutorController));
//Wallet
const walletController = new WalletController(walletService);
router.get('/wallet/:userId', authenticate, walletController.getAllWallet.bind(walletController));
router.post('/wallet/check-balance', authenticate, walletController.checkBalance.bind(walletController));
//Notification
const notificationController = new NotificationController(notificationService);
router.get("/user/:userId", authenticate, notificationController.getUserNotifications.bind(notificationController));
//Review 
const reviewController = new ReviewController(reviewService);
router.post('/course-review', authenticate, reviewController.createReview.bind(reviewController));
router.get('/listReviews/:courseId', authenticate, reviewController.getReviewsByCourse.bind(reviewController));
router.put('/course-review/:reviewId', authenticate, reviewController.updateReview.bind(reviewController));
router.get('/students/:studentId', authenticate, reviewController.getStudentById.bind(reviewController));
export default router;
