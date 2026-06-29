const express = require('express');
const { body, param } = require('express-validator');
const rbacController = require('../controllers/rbacController');
const validate = require('../middleware/validateMiddleware');
const { authenticateToken, authorizeRoles, authorizePermissions } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/permissions', authorizePermissions('ROLE_MANAGE'), rbacController.listPermissions);
router.get('/roles', authorizePermissions('ROLE_MANAGE'), rbacController.listRoles);

router.post(
  '/roles',
  authorizePermissions('ROLE_MANAGE'),
  [
    body('code').notEmpty().withMessage('Role code is required'),
    body('name').notEmpty().withMessage('Role name is required'),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
    validate
  ],
  rbacController.createRole
);

router.patch(
  '/roles/:id/permissions',
  authorizePermissions('ROLE_MANAGE'),
  [
    param('id').isMongoId().withMessage('Role id is invalid'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    validate
  ],
  rbacController.updateRolePermissions
);

router.patch(
  '/users/:userId/role',
  authorizePermissions('ROLE_MANAGE'),
  [
    param('userId').isMongoId().withMessage('User id is invalid'),
    body('role').notEmpty().withMessage('Role code is required'),
    validate
  ],
  rbacController.assignRoleToUser
);

module.exports = router;
