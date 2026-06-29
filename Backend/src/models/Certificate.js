const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    finalScore: { type: Number, required: true },
    certificateCode: { type: String, required: true, unique: true },
    verifyUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

certificateSchema.index({ enrollment: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
