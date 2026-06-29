const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const lessonMediaController = require('../controllers/lessonMediaController');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body, param } = require('express-validator');
const upload = require('../middleware/uploadMiddleware');

const lessonValidation = [
  body('chapter').isMongoId().withMessage('Chapter id is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('content').optional().isString(),
  body('contentType').optional().isIn(['VIDEO', 'PDF', 'DOCX', 'PPT', 'AUDIO', 'ASSIGNMENT', 'QUIZ', 'ARTICLE']),
  body('contentUrl').optional().isString(),
  body('durationMinutes').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  validate
];

const lessonUpdateValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().isString(),
  body('content').optional().isString(),
  body('contentType').optional().isIn(['VIDEO', 'PDF', 'DOCX', 'PPT', 'AUDIO', 'ASSIGNMENT', 'QUIZ', 'ARTICLE']),
  body('contentUrl').optional().isString(),
  body('durationMinutes').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  body('published').optional().isBoolean().withMessage('Published must be boolean'),
  validate
];

router.post('/', authenticateToken, authorizePermissions('LESSON_MANAGE'), lessonValidation, lessonController.createLesson);
router.get('/chapter/:chapterId', authenticateToken, param('chapterId').isMongoId(), validate, lessonController.getLessonsByChapter);
router.patch('/chapter/:chapterId/reorder', authenticateToken, authorizePermissions('LESSON_MANAGE'), param('chapterId').isMongoId(), validate, lessonController.reorderLessons);
router.get('/:id', authenticateToken, param('id').isMongoId(), validate, lessonController.getLessonById);
router.post('/:id/complete', authenticateToken, param('id').isMongoId(), validate, lessonController.completeLesson);
router.post('/:id/upload', authenticateToken, authorizePermissions('LESSON_MANAGE'), param('id').isMongoId(), validate, upload.single('file'), lessonMediaController.uploadLessonMedia);
router.delete('/:id/material', authenticateToken, authorizePermissions('LESSON_MANAGE'), param('id').isMongoId(), validate, lessonMediaController.deleteLessonMedia);
router.put('/:id', authenticateToken, authorizePermissions('LESSON_MANAGE'), param('id').isMongoId(), lessonUpdateValidation, lessonController.updateLesson);
router.delete('/:id', authenticateToken, authorizePermissions('LESSON_MANAGE'), param('id').isMongoId(), validate, lessonController.deleteLesson);

module.exports = router;
