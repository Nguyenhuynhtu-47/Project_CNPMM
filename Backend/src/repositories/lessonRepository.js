const BaseRepository = require('./baseRepository');
const Lesson = require('../models/Lesson');

class LessonRepository extends BaseRepository {
  constructor() {
    super(Lesson);
  }

  countPublishedByChapters(chapterIds) {
    return this.model.countDocuments({ chapter: { $in: chapterIds }, published: true });
  }
}

module.exports = new LessonRepository();
