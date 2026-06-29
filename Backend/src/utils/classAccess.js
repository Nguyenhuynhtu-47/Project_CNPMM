const ClassModel = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const { normalizeRoleCode } = require('../service/rbacService');

const getClassId = (classValue) => classValue?._id || classValue;
const getRoleCode = (user) => normalizeRoleCode(user?.roleRef?.code || user?.role);

const canManageClass = async (user, classId) => {
  if (!user || !classId) return false;
  if (['ADMIN', 'MANAGER'].includes(getRoleCode(user))) return true;
  return Boolean(await ClassModel.exists({ _id: classId, teacher: user._id }));
};

const canAccessClass = async (user, classId) => {
  if (!user || !classId) return false;
  const role = getRoleCode(user);
  if (['ADMIN', 'MANAGER'].includes(role)) return true;
  if (role === 'TEACHER') return canManageClass(user, classId);

  return Boolean(await Enrollment.exists({
    user: user._id,
    class: classId,
    status: { $ne: 'CANCELLED' }
  }));
};

module.exports = {
  getClassId,
  canManageClass,
  canAccessClass
};
