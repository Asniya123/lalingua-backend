import AdminController from "../../controllers/Admin/adminController.js";
import CategoryController from "../../controllers/Admin/categoryController.js";
import adminService from "../../service/Admin/adminService.js";
import { Router } from 'express';
import categoryService from "../../service/Admin/categoryService.js";
import LanguageController from "../../controllers/Admin/languageController.js";
import languageService from "../../service/Admin/languageService.js";
const router = Router();
const adminController = new AdminController(adminService);
router.post("/login", adminController.login.bind(adminController));
//Catogetory
const categoryController = new CategoryController(categoryService);
router.post('/categories', categoryController.addCategory.bind(categoryController));
router.get('/listCategory', categoryController.listCategory.bind(categoryController));
router.put('/editCategory/:categoryId', categoryController.editCategory.bind(categoryController));
router.delete('/delete/:categoryId', categoryController.deleteCategory.bind(categoryController));
//Language
const languageController = new LanguageController(languageService);
router.post('/addLanguage', languageController.addLanguage.bind(languageController));
router.get('/listLanguage', languageController.listLanguage.bind(languageController));
router.put('/editLanguage/:languageId', languageController.editLanguage.bind(languageController));
router.delete('/delete/:languageId', languageController.deleteLanguage.bind(languageController));
//User Management
router.get('/getUsers', adminController.getUsers.bind(adminController));
router.patch("/block-unblock/:userId", adminController.blockUnblock.bind(adminController));
//Tutor Management
router.get('/getTutor', adminController.getTutors.bind(adminController));
router.patch('/tutor-manage/:tutorId', adminController.tutorManagement.bind(adminController));
router.get('/getTutorManage', (req, res) => adminController.getAllTutors(req, res));
router.post('/manageTutor/:tutorId', (req, res) => adminController.updateTutorStatus(req, res));
//Course Management
router.get('/getCourses', adminController.getCourse.bind(adminController));
router.patch('/courseBlockUnblock/:courseId', adminController.blockedUnblocked.bind(adminController));
export default router;
