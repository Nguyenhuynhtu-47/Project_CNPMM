const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const notificationService = require('./notificationService');

const normalizeQuestion = (question = {}) => ({
  text: question.text,
  type: question.type === 'ESSAY' ? 'ESSAY' : 'MULTIPLE_CHOICE',
  options: (question.options || []).map((option, index) => (
    typeof option === 'string'
      ? { key: String.fromCharCode(65 + index), text: option }
      : option
  )),
  correctAnswer: question.correctAnswer,
  points: Number(question.points ?? question.score ?? 1)
});

const normalizeQuizPayload = (data = {}) => ({
  course: data.course,
  class: data.class,
  title: data.title,
  description: data.description,
  durationMinutes: data.durationMinutes,
  timeLimitSeconds: data.timeLimitSeconds,
  attemptsAllowed: data.attemptsAllowed ?? data.maxAttempts,
  oneAttempt: data.oneAttempt,
  published: data.published,
  questions: Array.isArray(data.questions) ? data.questions.map(normalizeQuestion) : []
});

const compactObject = (payload) => Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const createQuiz = async (data) => {
  return Quiz.create(compactObject(normalizeQuizPayload(data)));
};

const getQuizzesByClass = async (classId) => {
  return Quiz.find({ class: classId }).sort({ createdAt: -1 });
};

const getLatestSubmittedResultsForUser = async (quizIds = [], userId) => {
  if (!quizIds.length || !userId) return {};

  const results = await QuizResult.find({
    quiz: { $in: quizIds },
    user: userId,
    status: 'SUBMITTED'
  }).sort({ submittedAt: -1, createdAt: -1 });

  return results.reduce((acc, result) => {
    const quizId = String(result.quiz);
    if (!acc[quizId]) {
      acc[quizId] = result;
    }
    return acc;
  }, {});
};

const getQuizById = async (id) => {
  return Quiz.findById(id).populate('class', 'code teacher course');
};

const updateQuiz = async (id, data) => {
  return Quiz.findByIdAndUpdate(id, compactObject(normalizeQuizPayload(data)), { new: true });
};

const startAttempt = async (quizId, userId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new Error('QUIZ_NOT_FOUND');

  const prevCount = await QuizResult.countDocuments({ quiz: quizId, user: userId, status: { $in: ['IN_PROGRESS','SUBMITTED'] } });
  const attemptNumber = prevCount + 1;

  if (quiz.oneAttempt && prevCount > 0) throw new Error('ATTEMPTS_EXCEEDED');
  if (quiz.attemptsAllowed && quiz.attemptsAllowed > 0 && prevCount >= quiz.attemptsAllowed) throw new Error('ATTEMPTS_EXCEEDED');

  const qr = await QuizResult.create({ quiz: quizId, user: userId, attemptNumber, startedAt: new Date(), status: 'IN_PROGRESS' });
  return qr;
};

const gradeSubmission = async (quizId, userId, submittedAnswers = []) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new Error('QUIZ_NOT_FOUND');

  // check attempts
  const prevSubmittedCount = await QuizResult.countDocuments({ quiz: quizId, user: userId, status: 'SUBMITTED' });
  if (quiz.oneAttempt && prevSubmittedCount > 0) throw new Error('ATTEMPTS_EXCEEDED');
  if (quiz.attemptsAllowed && quiz.attemptsAllowed > 0 && prevSubmittedCount >= quiz.attemptsAllowed) throw new Error('ATTEMPTS_EXCEEDED');

  // try to find an in-progress attempt
  let quizResult = await QuizResult.findOne({ quiz: quizId, user: userId, status: 'IN_PROGRESS' });

  // If quiz has a time limit, require a started in-progress attempt
  if ((quiz.durationMinutes && quiz.durationMinutes > 0) || (quiz.timeLimitSeconds && quiz.timeLimitSeconds > 0)) {
    if (!quizResult) throw new Error('NO_ACTIVE_ATTEMPT');
    const limitSec = quiz.timeLimitSeconds && quiz.timeLimitSeconds > 0 ? quiz.timeLimitSeconds : (quiz.durationMinutes || 0) * 60;
    if (limitSec > 0) {
      const elapsed = (Date.now() - new Date(quizResult.startedAt).getTime()) / 1000;
      if (elapsed > limitSec) {
        quizResult.status = 'EXPIRED';
        quizResult.timeExpired = true;
        quizResult.submittedAt = new Date();
        quizResult.durationSeconds = Math.round(elapsed);
        await quizResult.save();
        throw new Error('TIME_EXCEEDED');
      }
    }
  }

  // grade
  let totalPoints = 0;
  let earnedPoints = 0;
  const answersResult = [];

  for (const q of quiz.questions) {
    totalPoints += q.points || 0;
    const found = submittedAnswers.find((a) => String(a.questionId) === String(q._id));
    if (!found) {
      answersResult.push({ questionId: q._id, answer: null, correct: false, pointsEarned: 0 });
      continue;
    }

    if (q.type === 'MULTIPLE_CHOICE') {
      const correct = String(found.answer) === String(q.correctAnswer);
      const pts = correct ? (q.points || 0) : 0;
      earnedPoints += pts;
      answersResult.push({ questionId: q._id, answer: found.answer, correct, pointsEarned: pts });
    } else {
      answersResult.push({ questionId: q._id, answer: found.answer, correct: false, pointsEarned: 0 });
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= 70;

  if (!quizResult) {
    // when no in-progress attempt required, create a submitted result
    const prevCount2 = await QuizResult.countDocuments({ quiz: quizId, user: userId });
    const attemptNumber = prevCount2 + 1;
    quizResult = await QuizResult.create({ quiz: quizId, user: userId, attemptNumber, startedAt: new Date(), submittedAt: new Date(), durationSeconds: 0, answers: answersResult, score, passed, status: 'SUBMITTED' });
    // notify user
    try { await notificationService.createNotification(userId, 'Quiz submitted', `Your attempt #${attemptNumber} for quiz "${quiz.title}" has been submitted. Score: ${score}`); } catch (e) { console.error('notify failed', e); }
  } else {
    quizResult.answers = answersResult;
    quizResult.score = score;
    quizResult.passed = passed;
    quizResult.submittedAt = new Date();
    quizResult.durationSeconds = Math.round((quizResult.submittedAt.getTime() - new Date(quizResult.startedAt).getTime()) / 1000);
    quizResult.status = 'SUBMITTED';
    await quizResult.save();
    try { await notificationService.createNotification(userId, 'Quiz submitted', `Your attempt #${quizResult.attemptNumber} for quiz "${quiz.title}" has been submitted. Score: ${score}`); } catch (e) { console.error('notify failed', e); }
  }

  return { quizResult, score, passed };
};

module.exports = {
  createQuiz,
  updateQuiz,
  getQuizzesByClass,
  getQuizById,
  startAttempt,
  gradeSubmission,
  getLatestSubmittedResultsForUser
};
