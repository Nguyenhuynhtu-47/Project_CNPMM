const Lesson = require('../models/Lesson');
const Chapter = require('../models/Chapter');
const LessonProgress = require('../models/LessonProgress');
const enrollmentService = require('../service/enrollmentService');
const { canAccessClass, canManageClass } = require('../utils/classAccess');
const { normalizeRoleCode } = require('../service/rbacService');

const buildLessonPayload = (body) => ({
  chapter: body.chapter,
  title: body.title,
  description: body.description ?? body.content ?? '',
  contentType: body.contentType,
  contentUrl: body.contentUrl,
  durationMinutes: body.durationMinutes,
  order: body.order,
  published: body.published
});

const removeUndefined = (payload) => {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
};

exports.createLesson = async (req, res) => {
  try {
    const { chapter } = req.body;
    const chapterExists = await Chapter.findById(chapter);
    if (!chapterExists) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    const allowed = await canManageClass(req.user, chapterExists.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    const lesson = await Lesson.create(removeUndefined(buildLessonPayload(req.body)));

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create lesson', error: error.message });
  }
};

exports.getLessonsByChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    const allowed = await canAccessClass(req.user, chapter.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You cannot access this class content' });
    }

    const lessons = await Lesson.find({ chapter: req.params.chapterId }).sort('order');
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch lessons', error: error.message });
  }
};

exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({ path: 'chapter', select: 'class course' });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    const allowed = await canAccessClass(req.user, lesson.chapter?.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You cannot access this lesson' });
    }
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch lesson', error: error.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const existingLesson = await Lesson.findById(req.params.id).populate({ path: 'chapter', select: 'class' });
    if (!existingLesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    const allowed = await canManageClass(req.user, existingLesson.chapter?.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    const updates = removeUndefined(buildLessonPayload(req.body));
    delete updates.chapter;

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update lesson', error: error.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const existingLesson = await Lesson.findById(req.params.id).populate({ path: 'chapter', select: 'class' });
    if (!existingLesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    const allowed = await canManageClass(req.user, existingLesson.chapter?.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete lesson', error: error.message });
  }
};

exports.reorderLessons = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    const allowed = await canManageClass(req.user, chapter.class);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not manage this class' });
    }

    const updates = Array.isArray(req.body.lessons) ? req.body.lessons : [];
    if (!updates.length) return res.status(400).json({ message: 'Lessons reorder payload is required' });

    await Promise.all(updates.map((item) => Lesson.findByIdAndUpdate(item.id, { order: item.order })));
    const lessons = await Lesson.find({ chapter: req.params.chapterId }).sort('order');

    return res.status(200).json({ message: 'Lessons reordered', lessons });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to reorder lessons', error: error.message });
  }
};

exports.completeLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const lesson = await Lesson.findById(lessonId).populate({ path: 'chapter', select: 'course class' });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const courseId = lesson.chapter?.course;
    const classId = lesson.chapter?.class;
    if (!courseId) return res.status(400).json({ message: 'Lesson not linked to course' });
    if (!classId) return res.status(400).json({ message: 'Lesson not linked to class' });

    const allowed = await canAccessClass(req.user, classId);
    const role = normalizeRoleCode(req.user?.roleRef?.code || req.user?.role);
    if (!allowed || ['ADMIN', 'TEACHER', 'MANAGER'].includes(role)) {
      return res.status(403).json({ message: 'You cannot record lesson activity' });
    }

    try {
      await LessonProgress.create({ user: userId, lesson: lessonId, course: courseId, class: classId });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }

    const { completedLessons, totalLessons } = await enrollmentService.refreshEnrollmentProgress(userId, courseId, classId);

    return res.status(200).json({ message: 'Lesson activity recorded', completedLessons, totalLessons });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to record lesson activity', error: error.message });
  }
};
