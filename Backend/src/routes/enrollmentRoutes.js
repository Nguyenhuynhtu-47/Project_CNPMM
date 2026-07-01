const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
// const { authenticateToken } = require('../middleware/authMiddleware');
const { authenticateToken, authorizePermissions, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body, param } = require('express-validator');

const enrollmentValidation = [
  body('courseId').isMongoId().withMessage('Course id is required')
];

router.post('/', authenticateToken, authorizeRoles('USER', 'STUDENT', 'ADMIN', 'MANAGER'), enrollmentValidation, validate, enrollmentController.enrollInCourse);
router.get('/admin/all', authenticateToken, authorizePermissions('ENROLLMENT_READ'), enrollmentController.getAllEnrollments);
router.get('/', authenticateToken, enrollmentController.getUserEnrollments);
router.patch('/:id/start-learning', authenticateToken, param('id').isMongoId(), validate, enrollmentController.startLearning);
router.get('/:id', authenticateToken, param('id').isMongoId(), validate, enrollmentController.getEnrollmentById);
module.exports = router;
