const BaseRepository = require('./baseRepository');
const Chapter = require('../models/Chapter');

class ChapterRepository extends BaseRepository {
  constructor() {
    super(Chapter);
  }

  findByCourse(courseId) {
    return this.model.find({ course: courseId }).sort('order');
  }

  findByClass(classId) {
    return this.model.find({ class: classId }).sort('order');
  }
}

module.exports = new ChapterRepository();
