const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

const createAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, teacher: req.user._id });
    return res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot create assignment' });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const updates = {
      course: req.body.course,
      class: req.body.class,
      title: req.body.title,
      description: req.body.description,
      attachmentUrl: req.body.attachmentUrl,
      dueDate: req.body.dueDate,
      maxScore: req.body.maxScore,
      published: req.body.published
    };
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const assignment = await Assignment.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('course', 'title')
      .populate('class', 'code')
      .populate('teacher', 'fullName email');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    return res.status(200).json({ message: 'Assignment updated', assignment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot update assignment' });
  }
};

const listAssignments = async (req, res) => {
  try {
    const query = {};
    if (req.query.course) query.course = req.query.course;
    if (req.query.class) query.class = req.query.class;
    const assignments = await Assignment.find(query)
      .populate('course', 'title')
      .populate('class', 'code')
      .populate('teacher', 'fullName email')
      .sort({ createdAt: -1 });
    return res.status(200).json({ assignments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load assignments' });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const submission = await Submission.findOneAndUpdate(
      { assignment: req.params.id, student: req.user._id },
      {
        assignment: req.params.id,
        student: req.user._id,
        content: req.body.content,
        fileUrl: req.body.fileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ message: 'Assignment submitted', submission });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot submit assignment' });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      {
        score: req.body.score,
        feedback: req.body.feedback,
        status: 'GRADED',
        gradedAt: new Date()
      },
      { new: true }
    ).populate('assignment', 'title maxScore').populate('student', 'fullName email');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    return res.status(200).json({ message: 'Submission graded', submission });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot grade submission' });
  }
};

const listSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.id })
      .populate('student', 'fullName email')
      .sort({ submittedAt: -1 });
    return res.status(200).json({ submissions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load submissions' });
  }
};

module.exports = {
  createAssignment,
  updateAssignment,
  listAssignments,
  submitAssignment,
  gradeSubmission,
  listSubmissions
};
