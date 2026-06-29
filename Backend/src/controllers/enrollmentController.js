const enrollmentService = require('../service/enrollmentService');

const enrollInCourse = async (req, res) => {
  try {
    const enrollment = await enrollmentService.assignStudentToClass(req.user._id, req.body.courseId);
    return res.status(201).json({ message: 'Enrollment created', enrollment });
  } catch (error) {
    if (error.message === 'COURSE_NOT_FOUND') {
      return res.status(404).json({ message: 'Course not found' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Cannot enroll in course' });
  }
};

const getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentService.getEnrollmentsForUser(req.user._id);
    return res.status(200).json({ enrollments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load enrollments' });
  }
};

const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentService.getEnrollments(req.query);
    return res.status(200).json({ enrollments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load enrollments' });
  }
};

const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await enrollmentService.getEnrollmentById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    return res.status(200).json({ enrollment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load enrollment' });
  }
};

const updateEnrollmentProgress = async (req, res) => {
  try {
    const updatedEnrollment = await enrollmentService.updateEnrollmentProgress(req.params.id, req.body.progress);
    return res.status(200).json({ message: 'Progress updated', enrollment: updatedEnrollment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot update progress' });
  }
};

module.exports = {
  enrollInCourse,
  getAllEnrollments,
  getUserEnrollments,
  getEnrollmentById,
  updateEnrollmentProgress
};
