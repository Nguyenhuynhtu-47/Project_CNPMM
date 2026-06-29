const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    score: { type: Number, min: 0 },
    feedback: { type: String, default: '' },
    status: { type: String, enum: ['SUBMITTED', 'GRADED', 'RETURNED'], default: 'SUBMITTED' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date }
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
