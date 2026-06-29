const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  key: { type: String },
  text: { type: String }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['MULTIPLE_CHOICE', 'ESSAY'], default: 'MULTIPLE_CHOICE' },
  options: { type: [optionSchema], default: [] },
  correctAnswer: { type: String },
  points: { type: Number, default: 1 }
}, { _id: true });

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  durationMinutes: { type: Number, default: 0 },
  // time limit in seconds (optional). If set, students must call startAttempt before submitting.
  timeLimitSeconds: { type: Number, default: 0 },
  // number of allowed attempts. 0 = unlimited
  attemptsAllowed: { type: Number, default: 0 },
  // if true, only one attempt allowed regardless of attemptsAllowed
  oneAttempt: { type: Boolean, default: false },
  questions: { type: [questionSchema], default: [] },
  published: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
