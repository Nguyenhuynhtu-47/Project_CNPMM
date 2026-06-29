const { compactObject, toObject } = require('./commonDto');

const toClassPayload = (body = {}) => compactObject({
  code: body.code,
  course: body.course,
  teacher: body.teacher,
  startDate: body.startDate,
  endDate: body.endDate,
  maxStudents: body.maxStudents,
  currentStudents: body.currentStudents,
  status: body.status
});

const toClassResponse = (classItem) => {
  const item = toObject(classItem);
  if (!item) return null;

  return {
    _id: item._id,
    code: item.code,
    course: item.course,
    teacher: item.teacher,
    startDate: item.startDate,
    endDate: item.endDate,
    maxStudents: item.maxStudents,
    currentStudents: item.currentStudents,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
};

module.exports = {
  toClassPayload,
  toClassResponse
};
