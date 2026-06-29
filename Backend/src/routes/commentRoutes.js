const express = require('express');
const { body, param } = require('express-validator');
const commentController = require('../controllers/commentController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/class/:classId', authenticateToken, [param('classId').isMongoId(), validate], commentController.listClassComments);
router.post(
  '/',
  authenticateToken,
  [
    body('class').isMongoId().withMessage('Class id is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate
  ],
  commentController.createComment
);
router.patch(
  '/:id/pin',
  authenticateToken,
  authorizePermissions('DISCUSSION_MANAGE'),
  [param('id').isMongoId(), validate],
  commentController.pinComment
);

module.exports = router;
