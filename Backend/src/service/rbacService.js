const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const { PERMISSIONS, ROLE_DEFINITIONS, ROLE_ALIASES } = require('../constants/rbac');

const normalizeRoleCode = (roleCode = '') => ROLE_ALIASES[String(roleCode).toUpperCase()] || String(roleCode).toUpperCase();

const seedDefaultRbac = async () => {
  const permissionMap = {};

  for (const permission of PERMISSIONS) {
    const savedPermission = await Permission.findOneAndUpdate(
      { code: permission.code },
      permission,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    permissionMap[savedPermission.code] = savedPermission;
  }

  const roleMap = {};

  for (const role of ROLE_DEFINITIONS) {
    const permissions = role.permissions
      .map((permissionCode) => permissionMap[permissionCode]?._id)
      .filter(Boolean);

    const savedRole = await Role.findOneAndUpdate(
      { code: role.code },
      {
        code: role.code,
        name: role.name,
        description: role.description,
        permissions,
        active: true,
        system: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    roleMap[savedRole.code] = savedRole;
  }

  const users = await User.find().populate('roleRef', 'code');
  for (const user of users) {
    const normalizedRoleCode = normalizeRoleCode(user.role);
    const currentRoleRefCode = user.roleRef?.code;
    if (roleMap[normalizedRoleCode] && currentRoleRefCode !== normalizedRoleCode) {
      user.role = normalizedRoleCode;
      user.roleRef = roleMap[normalizedRoleCode]._id;
      await user.save();
    }
  }

  return { permissions: Object.values(permissionMap), roles: Object.values(roleMap) };
};

const syncUserRoleRefs = async () => {
  const roles = await Role.find({ active: true });
  const roleMap = Object.fromEntries(roles.map((role) => [role.code, role]));
  const users = await User.find().populate('roleRef', 'code');

  await Promise.all(users.map(async (user) => {
    const normalizedRoleCode = normalizeRoleCode(user.role);
    const nextRole = roleMap[normalizedRoleCode];
    if (!nextRole) return;
    if (user.role === normalizedRoleCode && user.roleRef?.code === normalizedRoleCode) return;

    user.role = normalizedRoleCode;
    user.roleRef = nextRole._id;
    await user.save();
  }));
};

const ensureUserRoleRef = async (user) => {
  if (!user) return null;
  const normalizedRoleCode = normalizeRoleCode(user.role);
  if (user.role === normalizedRoleCode && user.roleRef?.code === normalizedRoleCode) return user;

  const role = await Role.findOne({ code: normalizedRoleCode, active: true });
  if (!role) return user;

  user.role = normalizedRoleCode;
  user.roleRef = role._id;
  await user.save();

  return User.findById(user._id).populate({
    path: 'roleRef',
    populate: {
      path: 'permissions',
      select: 'code name module'
    }
  });
};

const listPermissions = async () => {
  return Permission.find().sort({ module: 1, code: 1 });
};

const listRoles = async () => {
  return Role.find().populate('permissions', 'code name module description').sort({ code: 1 });
};

const createRole = async ({ code, name, description = '', permissions = [] }) => {
  const permissionDocs = await Permission.find({ code: { $in: permissions.map((item) => item.toUpperCase()) } });
  return Role.create({
    code: code.toUpperCase(),
    name,
    description,
    permissions: permissionDocs.map((permission) => permission._id),
    system: false
  });
};

const updateRolePermissions = async (roleId, permissions = []) => {
  const permissionDocs = await Permission.find({ code: { $in: permissions.map((item) => item.toUpperCase()) } });
  return Role.findByIdAndUpdate(
    roleId,
    { permissions: permissionDocs.map((permission) => permission._id) },
    { new: true }
  ).populate('permissions', 'code name module description');
};

const assignRoleToUser = async (userId, roleCode) => {
  const normalizedRoleCode = normalizeRoleCode(roleCode);
  const role = await Role.findOne({ code: normalizedRoleCode, active: true });
  if (!role) throw new Error('ROLE_NOT_FOUND');

  return User.findByIdAndUpdate(
    userId,
    { role: normalizedRoleCode, roleRef: role._id },
    { new: true }
  ).select('-password').populate('roleRef', 'code name permissions');
};

module.exports = {
  normalizeRoleCode,
  seedDefaultRbac,
  listPermissions,
  listRoles,
  createRole,
  updateRolePermissions,
  syncUserRoleRefs,
  ensureUserRoleRef,
  assignRoleToUser
};
