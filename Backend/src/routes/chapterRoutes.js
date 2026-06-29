const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body, param } = require('express-validator');

const chapterValidation = [
  body('course').isMongoId().withMessage('Course id is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  validate
];

router.post('/', authenticateToken, authorizePermissions('LESSON_MANAGE'), chapterValidation, chapterController.createChapter);
router.get('/course/:courseId', chapterController.getChaptersByCourse);
router.get('/:id', param('id').isMongoId(), validate, chapterController.getChapterById);
router.put('/:id', authenticateToken, authorizePermissions('LESSON_MANAGE'), param('id').isMongoId(), chapterValidation, validate, chapterController.updateChapter);
router.delete('/:id', authenticateToken, authorizePermissions('LESSON_MANAGE'), param('id').isMongoId(), validate, chapterController.deleteChapter);

module.exports = router;
