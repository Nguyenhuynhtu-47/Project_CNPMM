const classRepository = require('../repositories/classRepository');
const classDto = require('../dtos/classDto');

const buildClassQuery = (filters = {}) => {
  const query = {};

  if (filters.course) {
    query.course = filters.course;
  }

  if (filters.teacher) {
    query.teacher = filters.teacher;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  return query;
};

const createClass = async (classData) => {
  const payload = classDto.toClassPayload(classData);
  const classInstance = await classRepository.create(payload);
  return classDto.toClassResponse(classInstance);
};

const getClasses = async (filters = {}) => {
  const classes = await classRepository.findWithDetails(buildClassQuery(filters));
  return classes.map(classDto.toClassResponse);
};

const getClassById = async (id) => {
  const classInstance = await classRepository.findByIdWithDetails(id);
  return classDto.toClassResponse(classInstance);
};

const updateClass = async (id, classData) => {
  const payload = classDto.toClassPayload(classData);
  const classInstance = await classRepository.updateById(id, payload);
  return classDto.toClassResponse(classInstance);
};

const deleteClass = async (id) => {
  return classRepository.deleteById(id);
};

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass
};
