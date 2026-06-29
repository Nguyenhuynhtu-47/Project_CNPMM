const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeRoleCode } = require('../service/rbacService');
const { ROLE_DEFINITIONS } = require('../constants/rbac');

const DEFAULT_ROLE_PERMISSIONS = ROLE_DEFINITIONS.reduce((acc, role) => {
  acc[role.code] = role.permissions;
  return acc;
}, {});

const getPermissionCodes = (user) => {
  const permissions = user.roleRef?.permissions || [];
  return permissions.map((permission) => permission.code);
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authentication token.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');

    const user = await User.findById(payload.id)
      .select('-password')
      .populate({
        path: 'roleRef',
        populate: {
          path: 'permissions',
          select: 'code name module'
        }
      });

    if (!user) {
      return res.status(401).json({ message: 'User does not exist.' });
    }

    req.permissions = getPermissionCodes(user);
    user.permissions = req.permissions;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  const allowedRoles = roles.map(normalizeRoleCode);
  const currentRole = normalizeRoleCode(req.user?.roleRef?.code || req.user?.role);

  if (!req.user || !allowedRoles.includes(currentRole)) {
    return res.status(403).json({ message: 'You do not have permission to access this resource.' });
  }

  next();
};

const authorizePermissions = (...permissions) => (req, res, next) => {
  const currentRole = normalizeRoleCode(req.user?.roleRef?.code || req.user?.role);
  const userPermissions = req.permissions?.length
    ? req.permissions
    : (req.user?.permissions?.length ? req.user.permissions : DEFAULT_ROLE_PERMISSIONS[currentRole] || []);

  if (currentRole === 'ADMIN') {
    return next();
  }

  const hasPermission = permissions.every((permission) => userPermissions.includes(permission));
  if (!req.user || !hasPermission) {
    return res.status(403).json({ message: 'You do not have permission to access this resource.' });
  }

  next();
};

module.exports = { authenticateToken, authorizeRoles, authorizePermissions };
