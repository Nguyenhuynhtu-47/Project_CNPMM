const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, notificationController.listNotifications);
router.get('/admin/all', authenticateToken, authorizePermissions('SYSTEM_MANAGE'), notificationController.listAllNotifications);
router.post(
  '/admin/broadcast',
  authenticateToken,
  authorizePermissions('SYSTEM_MANAGE'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').optional().isString(),
    body('role').optional().isString(),
    body('status').optional().isString(),
    validate
  ],
  notificationController.broadcastNotification
);
router.patch('/:id/read', authenticateToken, notificationController.markRead);

module.exports = router;
