const BaseRepository = require('./baseRepository');
const LessonProgress = require('../models/LessonProgress');

class LessonProgressRepository extends BaseRepository {
  constructor() {
    super(LessonProgress);
  }

  countCompletedLessons(userId, courseId) {
    return this.model.countDocuments({ user: userId, course: courseId });
  }

  countCompletedLessonsByClass(userId, classId) {
    return this.model.countDocuments({ user: userId, class: classId });
  }
}

module.exports = new LessonProgressRepository();
