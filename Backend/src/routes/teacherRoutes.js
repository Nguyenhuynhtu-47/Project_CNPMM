const express = require('express');
const { param } = require('express-validator');
const teacherController = require('../controllers/teacherController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/classes', authorizePermissions('CLASS_READ'), teacherController.getMyClasses);
router.get('/classes/:classId/students', authorizePermissions('CLASS_READ'), [param('classId').isMongoId(), validate], teacherController.getClassStudents);
router.get('/quizzes/:quizId/results', authorizePermissions('QUIZ_MANAGE'), [param('quizId').isMongoId(), validate], teacherController.getQuizResults);
router.get('/assignments/:assignmentId/analytics', authorizePermissions('ASSIGNMENT_MANAGE'), [param('assignmentId').isMongoId(), validate], teacherController.getAssignmentAnalytics);

module.exports = router;
