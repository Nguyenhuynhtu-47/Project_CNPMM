const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body, param } = require('express-validator');

const classValidation = [
  body('code').notEmpty().withMessage('Class code is required'),
  body('course').isMongoId().withMessage('Course id is required'),
  body('teacher').isMongoId().withMessage('Teacher id is required'),
  body('startDate').isISO8601().toDate().withMessage('Start date is required'),
  body('endDate').isISO8601().toDate().withMessage('End date is required'),
  body('maxStudents').isInt({ min: 1 }).withMessage('Max students must be at least 1')
];

router.post('/', authenticateToken, authorizePermissions('CLASS_MANAGE'), classValidation, validate, classController.createClass);
router.get('/', classController.getClasses);
router.get('/:id', param('id').isMongoId(), validate, classController.getClassById);
router.put('/:id', authenticateToken, authorizePermissions('CLASS_MANAGE'), param('id').isMongoId(), classValidation, validate, classController.updateClass);
router.delete('/:id', authenticateToken, authorizePermissions('CLASS_MANAGE'), param('id').isMongoId(), validate, classController.deleteClass);

module.exports = router;
