const rbacService = require('../service/rbacService');

const listPermissions = async (req, res) => {
  try {
    await rbacService.seedDefaultRbac();
    const permissions = await rbacService.listPermissions();
    return res.status(200).json({ permissions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load permissions' });
  }
};

const listRoles = async (req, res) => {
  try {
    await rbacService.seedDefaultRbac();
    const roles = await rbacService.listRoles();
    return res.status(200).json({ roles });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load roles' });
  }
};

const createRole = async (req, res) => {
  try {
    const role = await rbacService.createRole(req.body);
    return res.status(201).json({ message: 'Role created', role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Role code already exists' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Cannot create role' });
  }
};

const updateRolePermissions = async (req, res) => {
  try {
    const role = await rbacService.updateRolePermissions(req.params.id, req.body.permissions || []);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    return res.status(200).json({ message: 'Role permissions updated', role });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot update role permissions' });
  }
};

const assignRoleToUser = async (req, res) => {
  try {
    const user = await rbacService.assignRoleToUser(req.params.userId, req.body.role);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'Role assigned', user });
  } catch (error) {
    if (error.message === 'ROLE_NOT_FOUND') {
      return res.status(404).json({ message: 'Role not found' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Cannot assign role' });
  }
};

module.exports = {
  listPermissions,
  listRoles,
  createRole,
  updateRolePermissions,
  assignRoleToUser
};
