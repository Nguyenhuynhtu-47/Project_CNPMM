const classService = require('../service/classService');
const { sendSuccess, sendError } = require('../utils/response');

const createClass = async (req, res) => {
  try {
    const classInstance = await classService.createClass(req.body);
    return sendSuccess(res, { statusCode: 201, message: 'Class created', data: { class: classInstance } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot create class' });
  }
};

const getClasses = async (req, res) => {
  try {
    const classes = await classService.getClasses(req.query);
    return sendSuccess(res, { data: { classes } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot load classes' });
  }
};

const getClassById = async (req, res) => {
  try {
    const classInstance = await classService.getClassById(req.params.id);
    if (!classInstance) return sendError(res, { statusCode: 404, message: 'Class not found' });
    return sendSuccess(res, { data: { class: classInstance } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot load class' });
  }
};

const updateClass = async (req, res) => {
  try {
    const classInstance = await classService.updateClass(req.params.id, req.body);
    if (!classInstance) return sendError(res, { statusCode: 404, message: 'Class not found' });
    return sendSuccess(res, { message: 'Class updated', data: { class: classInstance } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot update class' });
  }
};

const deleteClass = async (req, res) => {
  try {
    const classInstance = await classService.deleteClass(req.params.id);
    if (!classInstance) return sendError(res, { statusCode: 404, message: 'Class not found' });
    return sendSuccess(res, { message: 'Class deleted' });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot delete class' });
  }
};

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass
};
