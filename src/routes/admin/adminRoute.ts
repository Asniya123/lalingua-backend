import AdminController from "../../controllers/Admin/adminController.js"
import CategoryController from "../../controllers/Admin/categoryController.js"

import adminService from "../../service/Admin/adminService.js"

import {  Router } from 'express'
import categoryService from "../../service/Admin/categoryService.js"


const router = Router()

const adminController = new AdminController(adminService)

router.post("/login", adminController.login.bind(adminController));


//Catogetory
const categoryController = new CategoryController(categoryService);

router.post('/categories', categoryController.addCategory.bind(categoryController));
router.get('/listCategory', categoryController.listCategory.bind(categoryController))
router.put('/editCategory/:categoryId', categoryController.editCategory.bind(categoryController));
router.delete('/delete/:categoryId', categoryController.deleteCategory.bind(categoryController))

//User Management
router.get('/getUsers', adminController.getUsers.bind(adminController))
router.patch("/block-unblock/:userId", adminController.blockUnblock.bind(adminController));

//Tutor Management
router.get('/getTutor', adminController.getTutors.bind(adminController))
router.patch('/tutor-manage/:tutorId', adminController.tutorManagement.bind(adminController))
router.get('/getTutorManage', (req, res) => adminController.getAllTutors(req, res));
router.post('/manageTutor/:tutorId', (req, res) => adminController.updateTutorStatus(req, res))


export default router