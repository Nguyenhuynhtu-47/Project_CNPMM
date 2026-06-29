const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    contentType: {
      type: String,
      enum: ['VIDEO', 'PDF', 'DOCX', 'PPT', 'AUDIO', 'ASSIGNMENT', 'QUIZ', 'ARTICLE'],
      default: 'VIDEO'
    },
    contentUrl: {
      type: String,
      default: ''
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    order: {
      type: Number,
      default: 0
    },
    published: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Lesson', lessonSchema);
