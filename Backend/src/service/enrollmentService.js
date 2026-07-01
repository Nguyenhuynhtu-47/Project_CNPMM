const courseRepository = require('../repositories/courseRepository');
const classRepository = require('../repositories/classRepository');
const chapterRepository = require('../repositories/chapterRepository');
const lessonRepository = require('../repositories/lessonRepository');
const lessonProgressRepository = require('../repositories/lessonProgressRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const enrollmentDto = require('../dtos/enrollmentDto');
const ClassModel = require('../models/Class');

const getExistingEnrollment = async (userId, courseId) => {
  return enrollmentRepository.findActiveByUserAndCourse(userId, courseId);
};

const calculateCourseProgress = async (userId, courseId) => {
  const chapters = await chapterRepository.findByCourse(courseId);
  const chapterIds = chapters.map((chapter) => chapter._id);
  const totalLessons = await lessonRepository.countPublishedByChapters(chapterIds);
  const completedLessons = await lessonProgressRepository.countCompletedLessons(userId, courseId);
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return { completedLessons, totalLessons, progress };
};

const calculateClassProgress = async (userId, classId) => {
  const chapters = await chapterRepository.findByClass(classId);
  const chapterIds = chapters.map((chapter) => chapter._id);
  const totalLessons = await lessonRepository.countPublishedByChapters(chapterIds);
  const completedLessons = await lessonProgressRepository.countCompletedLessonsByClass(userId, classId);
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return { completedLessons, totalLessons, progress };
};

const createEnrollment = async ({ user, course, class: classId = null, status = 'WAITING_CLASS' }) => {
  const existingEnrollment = await getExistingEnrollment(user, course);
  if (existingEnrollment) return enrollmentDto.toEnrollmentResponse(existingEnrollment);

  const enrollment = await enrollmentRepository.create({
    user,
    course,
    class: classId,
    status
  });
  return enrollmentDto.toEnrollmentResponse(enrollment);
};

const assignStudentToClass = async (userId, courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new Error('COURSE_NOT_FOUND');

  const existingEnrollment = await getExistingEnrollment(userId, courseId);
  if (existingEnrollment) return enrollmentDto.toEnrollmentResponse(existingEnrollment);

  const classes = await classRepository.findAssignableClasses(courseId);
  const targetClass = classes[0];
  const enrollment = await enrollmentRepository.create({
    user: userId,
    course: courseId,
    class: targetClass ? targetClass._id : null,
    status: targetClass ? 'ASSIGNED_CLASS' : 'WAITING_CLASS'
  });

  if (targetClass) {
    targetClass.currentStudents += 1;
    await targetClass.save();
  }

  return enrollmentDto.toEnrollmentResponse(enrollment);
};

const getEnrollmentById = async (id) => {
  const enrollment = await enrollmentRepository.findByIdWithDetails(id);
  return enrollmentDto.toEnrollmentResponse(enrollment);
};

const updateEnrollmentProgress = async (enrollmentId, progress) => {
  const enrollment = await enrollmentRepository.findById(enrollmentId);
  if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND');

  enrollment.progress = progress;
  enrollment.status = enrollment.status === 'COMPLETED'
    ? 'COMPLETED'
    : enrollment.status === 'WAITING_CLASS'
      ? 'WAITING_CLASS'
      : 'LEARNING';
  await enrollment.save();
  await enrollment.populate('course', 'title price');
  await enrollment.populate({
    path: 'class',
    populate: [{ path: 'course', select: 'title' }, { path: 'teacher', select: 'fullName email' }]
  });

  return enrollmentDto.toEnrollmentResponse(enrollment);
};

const refreshEnrollmentProgress = async (userId, courseId, classId = null) => {
  const enrollment = await enrollmentRepository.findByUserAndCourse(userId, courseId);
  const targetClassId = classId || enrollment?.class;
  const courseProgress = targetClassId
    ? await calculateClassProgress(userId, targetClassId)
    : await calculateCourseProgress(userId, courseId);

  if (enrollment) {
    enrollment.progress = courseProgress.progress;
    enrollment.status = enrollment.status === 'COMPLETED'
      ? 'COMPLETED'
      : enrollment.status === 'WAITING_CLASS'
        ? 'WAITING_CLASS'
        : 'LEARNING';
    await enrollment.save();
  }

  return { enrollment: enrollmentDto.toEnrollmentResponse(enrollment), ...courseProgress };
};

const getEnrollmentsForUser = async (userId) => {
  const enrollments = await enrollmentRepository.findByUserWithDetails(userId);
  return enrollments.map(enrollmentDto.toEnrollmentResponse);
};

const getEnrollments = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.course) filter.course = query.course;
  if (query.class) filter.class = query.class;
  if (query.user) filter.user = query.user;

  const enrollments = await enrollmentRepository.findAllWithDetails(filter);
  return enrollments.map(enrollmentDto.toEnrollmentResponse);
};

const approveCourseCompletion = async ({ enrollmentId, teacherId, note = '' }) => {
  const enrollment = await enrollmentRepository.findById(enrollmentId);
  if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND');
  if (!enrollment.class) throw new Error('CLASS_NOT_ASSIGNED');

  const classItem = await ClassModel.findOne({ _id: enrollment.class, teacher: teacherId });
  if (!classItem) throw new Error('CLASS_NOT_ASSIGNED_TO_TEACHER');

  enrollment.progress = 100;
  enrollment.status = 'COMPLETED';
  enrollment.completedBy = teacherId;
  enrollment.completedAt = new Date();
  enrollment.completionNote = note;
  await enrollment.save();

  await enrollment.populate('course', 'title price');
  await enrollment.populate('user', 'fullName email');
  await enrollment.populate({
    path: 'class',
    populate: [{ path: 'course', select: 'title' }, { path: 'teacher', select: 'fullName email' }]
  });

  return enrollmentDto.toEnrollmentResponse(enrollment);
};

module.exports = {
  getExistingEnrollment,
  createEnrollment,
  assignStudentToClass,
  getEnrollmentById,
  updateEnrollmentProgress,
  refreshEnrollmentProgress,
  calculateCourseProgress,
  calculateClassProgress,
  approveCourseCompletion,
  getEnrollmentsForUser,
  getEnrollments
};
