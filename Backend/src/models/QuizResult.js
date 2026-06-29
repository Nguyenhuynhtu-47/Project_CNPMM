const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answer: { type: String },
  correct: { type: Boolean, default: false },
  pointsEarned: { type: Number, default: 0 }
}, { _id: false });

const quizResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: { type: [answerSchema], default: [] },
  attemptNumber: { type: Number, default: 1 },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED'], default: 'IN_PROGRESS' },
  timeExpired: { type: Boolean, default: false }
});

module.exports = mongoose.model('QuizResult', quizResultSchema);
