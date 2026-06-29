const bcrypt = require('bcryptjs');
const User = require('../models/User');
const rbacService = require('../service/rbacService');

const listUsers = async (req, res) => {
  try {
    await rbacService.seedDefaultRbac();
    await rbacService.syncUserRoleRefs();

    const query = {};
    if (req.query.role) query.role = rbacService.normalizeRoleCode(req.query.role);
    if (req.query.status) query.status = req.query.status;
    if (req.query.q) {
      query.$or = [
        { email: { $regex: req.query.q, $options: 'i' } },
        { fullName: { $regex: req.query.q, $options: 'i' } }
      ];
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select('-password').populate('roleRef', 'code name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    return res.status(200).json({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load users' });
  }
};

const createStaff = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) return res.status(409).json({ message: 'Email already exists' });

    const normalizedRole = rbacService.normalizeRoleCode(req.body.role || 'TEACHER');
    const password = await bcrypt.hash(req.body.password || '123456', 10);
    const user = await User.create({
      email: req.body.email,
      password,
      role: normalizedRole,
      status: req.body.status || 'ACTIVE',
      fullName: req.body.fullName || '',
      phone: req.body.phone || '',
      address: req.body.address || ''
    });

    await rbacService.assignRoleToUser(user._id, normalizedRole);
    const savedUser = await User.findById(user._id).select('-password').populate('roleRef', 'code name');
    return res.status(201).json({ message: 'Staff account created', user: savedUser });
  } catch (error) {
    if (error.message === 'ROLE_NOT_FOUND') return res.status(404).json({ message: 'Role not found' });
    console.error(error);
    return res.status(500).json({ message: 'Cannot create staff account' });
  }
};

const updateUser = async (req, res) => {
  try {
    const updates = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      address: req.body.address,
      avatar: req.body.avatar,
      status: req.body.status
    };
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    let user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.role) {
      user = await rbacService.assignRoleToUser(req.params.id, req.body.role);
    }

    return res.status(200).json({ message: 'User updated', user });
  } catch (error) {
    if (error.message === 'ROLE_NOT_FOUND') return res.status(404).json({ message: 'Role not found' });
    console.error(error);
    return res.status(500).json({ message: 'Cannot update user' });
  }
};

const setUserStatus = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User status updated', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot update user status' });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'Password reset successfully', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot reset password' });
  }
};

module.exports = {
  listUsers,
  createStaff,
  updateUser,
  setUserStatus,
  resetUserPassword
};
