const courseRepository = require('../repositories/courseRepository');
const categoryRepository = require('../repositories/categoryRepository');
const chapterRepository = require('../repositories/chapterRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const lessonRepository = require('../repositories/lessonRepository');
const lessonProgressRepository = require('../repositories/lessonProgressRepository');
const courseDto = require('../dtos/courseDto');

const buildCourseQuery = (filters = {}) => {
  const query = {};

  if (filters.q) {
    query.$or = [
      { title: { $regex: filters.q, $options: 'i' } },
      { description: { $regex: filters.q, $options: 'i' } }
    ];
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.minPrice != null) {
    query.price = { ...(query.price || {}), $gte: Number(filters.minPrice) };
  }

  if (filters.maxPrice != null) {
    query.price = { ...(query.price || {}), $lte: Number(filters.maxPrice) };
  }

  return query;
};

const getCourseSort = (sort) => {
  const sortMap = {
    newest: { createdAt: -1 },
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    titleAsc: { title: 1 }
  };

  return sortMap[sort] || sortMap.newest;
};

const createCourse = async (courseData) => {
  const payload = courseDto.toCoursePayload(courseData);
  const course = await courseRepository.create(payload);
  return courseDto.toCourseResponse(course);
};

const getCourses = async (filters = {}) => {
  const query = buildCourseQuery(filters);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 6;
  const skip = (page - 1) * limit;

  const total = await courseRepository.count(query);
  const courses = await courseRepository.findWithFilters(query, {
    sort: getCourseSort(filters.sort),
    skip,
    limit
  });

  return courseDto.toCourseListResponse(courses, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
};

const getCourseById = async (id) => {
  const course = await courseRepository.findByIdWithCategory(id);
  return courseDto.toCourseResponse(course);
};

const getCourseChapters = async (courseId) => {
  return chapterRepository.findByCourse(courseId);
};

const getCourseProgress = async (userId, courseId) => {
  const enrollment = await enrollmentRepository.findByUserAndCourse(userId, courseId);
  const chapters = await chapterRepository.findByCourse(courseId);
  const chapterIds = chapters.map((chapter) => chapter._id);
  const totalLessons = await lessonRepository.countPublishedByChapters(chapterIds);
  const completedLessons = await lessonProgressRepository.countCompletedLessons(userId, courseId);
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (!enrollment) {
    return { completedLessons, totalLessons, progress: 0, status: 'NOT_ENROLLED' };
  }

  return {
    completedLessons,
    totalLessons,
    progress,
    status: enrollment.status
  };
};

const updateCourse = async (id, courseData) => {
  const payload = courseDto.toCoursePayload(courseData);
  const course = await courseRepository.updateById(id, payload);
  return courseDto.toCourseResponse(course);
};

const deleteCourse = async (id) => {
  return courseRepository.deleteById(id);
};

const createCategory = async (categoryData) => {
  const payload = courseDto.toCategoryPayload(categoryData);
  return categoryRepository.create(payload);
};

const getCategories = async () => {
  return categoryRepository.findAllSorted();
};

const updateCategory = async (id, categoryData) => {
  const payload = courseDto.toCategoryPayload(categoryData);
  return categoryRepository.updateById(id, payload);
};

const deleteCategory = async (id) => {
  return categoryRepository.deleteById(id);
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  getCourseChapters,
  getCourseProgress,
  updateCourse,
  deleteCourse,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};
