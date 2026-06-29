const express = require('express');
const { body, param } = require('express-validator');
const adminUserController = require('../controllers/adminUserController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizePermissions('USER_READ'), adminUserController.listUsers);
router.post(
  '/',
  authorizePermissions('USER_MANAGE'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').notEmpty().withMessage('Role is required'),
    validate
  ],
  adminUserController.createStaff
);
router.put('/:id', authorizePermissions('USER_MANAGE'), [param('id').isMongoId(), validate], adminUserController.updateUser);
router.patch(
  '/:id/status',
  authorizePermissions('USER_MANAGE'),
  [
    param('id').isMongoId(),
    body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    validate
  ],
  adminUserController.setUserStatus
);
router.patch(
  '/:id/password',
  authorizePermissions('USER_MANAGE'),
  [
    param('id').isMongoId(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
  ],
  adminUserController.resetUserPassword
);

module.exports = router;
