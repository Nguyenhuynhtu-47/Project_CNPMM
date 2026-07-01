const ClassModel = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { normalizeRoleCode } = require('../service/rbacService');
const enrollmentService = require('../service/enrollmentService');

const getMyClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find({ teacher: req.user._id })
      .populate('course', 'title price')
      .populate('teacher', 'fullName email')
      .sort({ startDate: 1 });
    return res.status(200).json({ classes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load teacher classes' });
  }
};

const getClassStudents = async (req, res) => {
  try {
    const classItem = await ClassModel.findOne({ _id: req.params.classId, teacher: req.user._id });
    if (!classItem) return res.status(404).json({ message: 'Class not found or not assigned to current teacher' });

    const enrollments = await Enrollment.find({ class: req.params.classId, status: { $ne: 'CANCELLED' } })
      .populate('user', 'fullName email phone avatar')
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    return res.status(200).json({ students: enrollments.map((item) => item.user), enrollments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load class students' });
  }
};

const getQuizResults = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).populate('course', 'title').populate('class', 'code teacher');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const managesClass = quiz.class && String(quiz.class.teacher) === String(req.user._id);
    const role = normalizeRoleCode(req.user?.roleRef?.code || req.user?.role);
    if (!managesClass && role !== 'ADMIN') {
      return res.status(403).json({ message: 'You do not manage this quiz class' });
    }

    const results = await QuizResult.find({ quiz: req.params.quizId })
      .populate('user', 'fullName email')
      .sort({ submittedAt: -1 });
    return res.status(200).json({ quiz, results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load quiz results' });
  }
};

const getAssignmentAnalytics = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).populate('course', 'title').populate('class', 'code');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const submissions = await Submission.find({ assignment: req.params.assignmentId });
    const graded = submissions.filter((item) => item.status === 'GRADED');
    const avgScore = graded.length
      ? Math.round(graded.reduce((sum, item) => sum + Number(item.score || 0), 0) / graded.length)
      : 0;

    return res.status(200).json({
      assignment,
      totalSubmissions: submissions.length,
      gradedSubmissions: graded.length,
      pendingSubmissions: submissions.length - graded.length,
      averageScore: avgScore
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load assignment analytics' });
  }
};

const approveCourseCompletion = async (req, res) => {
  try {
    const enrollment = await enrollmentService.approveCourseCompletion({
      enrollmentId: req.params.enrollmentId,
      teacherId: req.user._id,
      note: req.body.note || ''
    });

    return res.status(200).json({ message: 'Course completion approved', enrollment });
  } catch (error) {
    console.error(error);
    if (error.message === 'ENROLLMENT_NOT_FOUND') return res.status(404).json({ message: 'Enrollment not found' });
    if (['CLASS_NOT_ASSIGNED', 'CLASS_NOT_ASSIGNED_TO_TEACHER'].includes(error.message)) {
      return res.status(403).json({ message: 'You do not manage this enrollment class' });
    }
    return res.status(500).json({ message: 'Cannot approve course completion' });
  }
};

module.exports = {
  getMyClasses,
  getClassStudents,
  getQuizResults,
  getAssignmentAnalytics,
  approveCourseCompletion
};
