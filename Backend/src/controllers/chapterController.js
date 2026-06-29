const Chapter = require('../models/Chapter');
const Course = require('../models/Course');

exports.createChapter = async (req, res) => {
  try {
    const { course, title, description, order } = req.body;
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const chapter = await Chapter.create({
      course,
      title,
      description,
      order
    });

    res.status(201).json(chapter);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create chapter', error: error.message });
  }
};

exports.getChaptersByCourse = async (req, res) => {
  try {
    const chapters = await Chapter.find({ course: req.params.courseId }).sort('order');
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
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch chapter', error: error.message });
  }
};

exports.updateChapter = async (req, res) => {
  try {
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
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete chapter', error: error.message });
  }
};
