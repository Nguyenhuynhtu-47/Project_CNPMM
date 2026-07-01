const { toObject } = require('./commonDto');

const toEnrollmentResponse = (enrollment) => {
  const item = toObject(enrollment);
  if (!item) return null;

  return {
    _id: item._id,
    user: item.user,
    course: item.course,
    class: item.class,
    status: item.status,
    enrolledAt: item.enrolledAt,
    progress: item.progress,
    completedBy: item.completedBy,
    completedAt: item.completedAt,
    completionNote: item.completionNote,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
};

module.exports = {
  toEnrollmentResponse
};
