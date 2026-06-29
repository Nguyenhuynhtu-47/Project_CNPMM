const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body, param } = require('express-validator');
const upload = require('../middleware/uploadMiddleware');

const courseValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be numeric'),
  body('category').notEmpty().withMessage('Category is required')
];

const categoryValidation = [
  body('name').notEmpty().withMessage('Name is required')
];

router.post('/categories', authenticateToken, authorizePermissions('COURSE_MANAGE'), categoryValidation, validate, courseController.createCategory);
router.get('/categories', courseController.getCategories);
router.put('/categories/:id', authenticateToken, authorizePermissions('COURSE_MANAGE'), param('id').isMongoId(), categoryValidation, validate, courseController.updateCategory);
router.delete('/categories/:id', authenticateToken, authorizePermissions('COURSE_MANAGE'), param('id').isMongoId(), validate, courseController.deleteCategory);
router.post('/', authenticateToken, authorizePermissions('COURSE_MANAGE'), courseValidation, validate, courseController.createCourse);
router.get('/', courseController.getCourses);
router.get('/:id', param('id').isMongoId(), validate, courseController.getCourseById);
router.get('/:id/progress', authenticateToken, param('id').isMongoId(), validate, courseController.getCourseProgress);
router.post('/:id/image', authenticateToken, authorizePermissions('COURSE_MANAGE'), param('id').isMongoId(), validate, upload.single('file'), courseController.uploadCourseImage);
router.put('/:id', authenticateToken, authorizePermissions('COURSE_MANAGE'), param('id').isMongoId(), courseValidation, validate, courseController.updateCourse);
router.delete('/:id', authenticateToken, authorizePermissions('COURSE_MANAGE'), param('id').isMongoId(), validate, courseController.deleteCourse);

module.exports = router;
