const quizService = require('../service/quizService');
const ClassModel = require('../models/Class');
const { canAccessClass, canManageClass: userCanManageClass } = require('../utils/classAccess');
const { normalizeRoleCode } = require('../service/rbacService');

const getRole = (req) => normalizeRoleCode(req.user?.roleRef?.code || req.user?.role);

const canManageClass = async (req, classId) => {
  return userCanManageClass(req.user, classId);
};

const canAccessQuiz = async (req, quiz) => {
  if (!quiz?.class) return false;
  const classId = quiz.class?._id || quiz.class;
  return canAccessClass(req.user, classId);
};

const createQuiz = async (req, res) => {
  try {
    const data = { ...req.body }; // expect course, title, questions, etc.
    if (!data.class) return res.status(400).json({ message: 'Class id is required' });
    const allowed = await canManageClass(req, data.class);
    if (!allowed) return res.status(403).json({ message: 'You do not manage this class' });
    const quiz = await quizService.createQuiz(data);
    return res.status(201).json({ message: 'Quiz created', quiz });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot create quiz' });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const existingQuiz = await quizService.getQuizById(req.params.id);
    if (!existingQuiz) return res.status(404).json({ message: 'Quiz not found' });
    const targetClassId = req.body.class || existingQuiz.class?._id || existingQuiz.class;
    const allowed = await canManageClass(req, targetClassId);
    if (!allowed) return res.status(403).json({ message: 'You do not manage this class' });
    const quiz = await quizService.updateQuiz(req.params.id, req.body);
    return res.status(200).json({ message: 'Quiz updated', quiz });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot update quiz' });
  }
};

const getQuizzesByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const classItem = await ClassModel.findById(classId).select('teacher');
    if (!classItem) return res.status(404).json({ message: 'Class not found' });

    const role = getRole(req);
    if (role === 'TEACHER' && String(classItem.teacher) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    if (!['ADMIN', 'MANAGER', 'TEACHER'].includes(role)) {
      const allowed = await canAccessClass(req.user, classId);
      if (!allowed) return res.status(403).json({ message: 'You are not enrolled in this class' });
    }

    const quizzes = await quizService.getQuizzesByClass(classId);
    return res.status(200).json({ quizzes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load quizzes' });
  }
};

const getQuizById = async (req, res) => {
  try {
    const quiz = await quizService.getQuizById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const allowed = await canAccessQuiz(req, quiz);
    if (!allowed) return res.status(403).json({ message: 'You cannot access this quiz' });

    // hide correct answers when returning quiz to students
    const quizObj = quiz.toObject();
    quizObj.questions = quizObj.questions.map((q) => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });

    return res.status(200).json({ quiz: quizObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load quiz' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const quiz = await quizService.getQuizById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const allowed = await canAccessQuiz(req, quiz);
    if (!allowed || ['ADMIN', 'MANAGER', 'TEACHER'].includes(getRole(req))) return res.status(403).json({ message: 'You cannot submit this quiz' });

    const { answers } = req.body; // [{ questionId, answer }]
    const result = await quizService.gradeSubmission(quizId, userId, answers || []);
    return res.status(200).json({ message: 'Submitted', score: result.score, passed: result.passed, result: result.quizResult });
  } catch (error) {
    console.error(error);
    if (error.message === 'QUIZ_NOT_FOUND') return res.status(404).json({ message: 'Quiz not found' });
    if (error.message === 'ATTEMPTS_EXCEEDED') return res.status(403).json({ message: 'Attempt limit exceeded' });
    if (error.message === 'NO_ACTIVE_ATTEMPT') return res.status(400).json({ message: 'No active attempt. Start attempt first.' });
    if (error.message === 'TIME_EXCEEDED') return res.status(400).json({ message: 'Time limit exceeded for this attempt' });
    return res.status(500).json({ message: 'Cannot submit quiz' });
  }
};

const startAttempt = async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const quiz = await quizService.getQuizById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    const allowed = await canAccessQuiz(req, quiz);
    if (!allowed || ['ADMIN', 'MANAGER', 'TEACHER'].includes(getRole(req))) return res.status(403).json({ message: 'You cannot start this quiz' });
    const qr = await quizService.startAttempt(quizId, userId);
    return res.status(201).json({ message: 'Attempt started', attempt: qr });
  } catch (error) {
    console.error(error);
    if (error.message === 'QUIZ_NOT_FOUND') return res.status(404).json({ message: 'Quiz not found' });
    if (error.message === 'ATTEMPTS_EXCEEDED') return res.status(403).json({ message: 'Attempt limit exceeded' });
    return res.status(500).json({ message: 'Cannot start attempt' });
  }
};

module.exports = {
  createQuiz,
  updateQuiz,
  getQuizzesByClass,
  getQuizById,
  startAttempt,
  submitQuiz
};
