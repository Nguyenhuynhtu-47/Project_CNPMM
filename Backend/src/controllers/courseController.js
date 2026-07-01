const courseService = require('../service/courseService');
const { sendSuccess, sendError } = require('../utils/response');
const { uploadDataUri } = require('../utils/cloudinary');


const getCourses = async (req, res) => {
  try {
    const result = await courseService.getCourses(req.query);
    return sendSuccess(res, { data: result });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot load courses' });
  }
};

const createCourse = async (req, res) => {
  try {
    const course = await courseService.createCourse(req.body);
    return sendSuccess(res, { statusCode: 201, message: 'Course created', data: { course } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot create course' });
  }
};
const getCourseById = async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) return sendError(res, { statusCode: 404, message: 'Course not found' });
    return sendSuccess(res, { data: { course } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot load course' });
  }
};

const getCourseChapters = async (req, res) => {
  try {
    const chapters = await courseService.getCourseChapters(req.params.id);
    return sendSuccess(res, { data: { chapters } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot load course chapters' });
  }
};

const getCourseProgress = async (req, res) => {
  try {
    const progress = await courseService.getCourseProgress(req.user._id, req.params.id);
    return sendSuccess(res, { data: { progress } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot load course progress' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    if (!course) return sendError(res, { statusCode: 404, message: 'Course not found' });
    return sendSuccess(res, { message: 'Course updated', data: { course } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot update course' });
  }
};

const uploadCourseImage = async (req, res) => {
  try {
    if (!req.file) return sendError(res, { statusCode: 400, message: 'No image uploaded' });

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploadResult = await uploadDataUri(dataUri, { folder: 'elms/courses/images' });
    const course = await courseService.updateCourse(req.params.id, { imageUrl: uploadResult.secure_url });
    if (!course) return sendError(res, { statusCode: 404, message: 'Course not found' });

    return sendSuccess(res, { message: 'Course image uploaded', data: { course } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot upload course image' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await courseService.deleteCourse(req.params.id);
    if (!course) return sendError(res, { statusCode: 404, message: 'Course not found' });
    return sendSuccess(res, { message: 'Course deleted' });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot delete course' });
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await courseService.createCategory(req.body);
    return sendSuccess(res, { statusCode: 201, message: 'Category created', data: { category } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot create category' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await courseService.getCategories();
    return sendSuccess(res, { data: { categories } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot load categories' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await courseService.updateCategory(req.params.id, req.body);
    if (!category) return sendError(res, { statusCode: 404, message: 'Category not found' });
    return sendSuccess(res, { message: 'Category updated', data: { category } });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await courseService.deleteCategory(req.params.id);
    if (!category) return sendError(res, { statusCode: 404, message: 'Category not found' });
    return sendSuccess(res, { message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    return sendError(res, { message: 'Cannot delete category' });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  getCourseChapters,
  getCourseProgress,
  updateCourse,
  uploadCourseImage,
  deleteCourse,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};
