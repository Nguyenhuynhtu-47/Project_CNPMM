const quizService = require('../service/quizService');

const createQuiz = async (req, res) => {
  try {
    const data = { ...req.body }; // expect course, title, questions, etc.
    const quiz = await quizService.createQuiz(data);
    return res.status(201).json({ message: 'Quiz created', quiz });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot create quiz' });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const quiz = await quizService.updateQuiz(req.params.id, req.body);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    return res.status(200).json({ message: 'Quiz updated', quiz });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot update quiz' });
  }
};

const getQuizzesByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const quizzes = await quizService.getQuizzesByCourse(courseId);
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
  getQuizzesByCourse,
  getQuizById,
  startAttempt,
  submitQuiz
};
