const Chapter = require('../models/Chapter');
const Course = require('../models/Course');
const ClassModel = require('../models/Class');
const { canAccessClass, canManageClass } = require('../utils/classAccess');

exports.createChapter = async (req, res) => {
  try {
    const { course, class: classId, title, description, order } = req.body;
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const classItem = await ClassModel.findOne({ _id: classId, course });
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found for this course' });
    }

    const allowed = await canManageClass(req.user, classId);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    const chapter = await Chapter.create({
      course,
      class: classId,
      title,
      description,
      order
    });

    res.status(201).json(chapter);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create chapter', error: error.message });
  }
};

exports.getChaptersByClass = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed) {
      return res.status(403).json({ message: 'You cannot access this class content' });
    }

    const chapters = await Chapter.find({ class: req.params.classId }).sort('order');
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch chapters', error: error.message });
  }
};

exports.getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    const allowed = await canAccessClass(req.user, chapter.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You cannot access this chapter' });
    }
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch chapter', error: error.message });
  }
};

exports.updateChapter = async (req, res) => {
  try {
    const existingChapter = await Chapter.findById(req.params.id);
    if (!existingChapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    const allowed = await canManageClass(req.user, existingChapter.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      order: req.body.order
    };
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update chapter', error: error.message });
  }
};

exports.deleteChapter = async (req, res) => {
  try {
    const existingChapter = await Chapter.findById(req.params.id);
    if (!existingChapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    const allowed = await canManageClass(req.user, existingChapter.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete chapter', error: error.message });
  }
};
