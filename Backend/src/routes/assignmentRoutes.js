const express = require('express');
const { body, param } = require('express-validator');
const assignmentController = require('../controllers/assignmentController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, authorizePermissions('ASSIGNMENT_READ'), assignmentController.listAssignments);
router.post(
  '/',
  authenticateToken,
  authorizePermissions('ASSIGNMENT_MANAGE'),
  [
    body('course').isMongoId().withMessage('Course id is required'),
    body('title').notEmpty().withMessage('Title is required'),
    validate
  ],
  assignmentController.createAssignment
);
router.put(
  '/:id',
  authenticateToken,
  authorizePermissions('ASSIGNMENT_MANAGE'),
  [
    param('id').isMongoId(),
    body('course').optional().isMongoId(),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    validate
  ],
  assignmentController.updateAssignment
);
router.post(
  '/:id/submit',
  authenticateToken,
  [param('id').isMongoId(), validate],
  assignmentController.submitAssignment
);
router.get(
  '/:id/submissions',
  authenticateToken,
  authorizePermissions('SUBMISSION_MANAGE'),
  [param('id').isMongoId(), validate],
  assignmentController.listSubmissions
);
router.patch(
  '/submissions/:submissionId/grade',
  authenticateToken,
  authorizePermissions('SUBMISSION_MANAGE'),
  [
    param('submissionId').isMongoId(),
    body('score').isNumeric().withMessage('Score is required'),
    validate
  ],
  assignmentController.gradeSubmission
);

module.exports = router;
