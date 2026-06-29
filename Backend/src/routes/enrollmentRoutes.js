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
router.get('/:id', authenticateToken, param('id').isMongoId(), validate, enrollmentController.getEnrollmentById);
router.patch('/:id/progress', authenticateToken, [
  param('id').isMongoId(),
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
  validate
], enrollmentController.updateEnrollmentProgress);

module.exports = router;
