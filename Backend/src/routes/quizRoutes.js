const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');
const validate = require('../middleware/validateMiddleware');

const quizValidation = [
  body('course').isMongoId().withMessage('Course id is required'),
  body('class').isMongoId().withMessage('Class id is required'),
  body('title').notEmpty().withMessage('Title is required'),
  validate
];
// console.log({
//   authenticateToken: typeof authenticateToken,
//   authorizeRoles: typeof authorizeRoles,
//   createQuiz: typeof quizController.createQuiz,
//   getQuizById: typeof quizController.getQuizById,
//   startAttempt: typeof quizController.startAttempt,
//   submitQuiz: typeof quizController.submitQuiz,
//   validate: typeof validate
// });
router.post('/', authenticateToken, authorizePermissions('QUIZ_MANAGE'), quizValidation, quizController.createQuiz);
router.get('/class/:classId', authenticateToken, param('classId').isMongoId(), validate, quizController.getQuizzesByClass);
router.get('/:id', authenticateToken, param('id').isMongoId(), validate, quizController.getQuizById);
router.put('/:id', authenticateToken, authorizePermissions('QUIZ_MANAGE'), param('id').isMongoId(), quizValidation, quizController.updateQuiz);
router.post('/:id/start', authenticateToken, param('id').isMongoId(), validate, quizController.startAttempt);
router.post('/:id/submit', authenticateToken, param('id').isMongoId(), validate, quizController.submitQuiz);

module.exports = router;
