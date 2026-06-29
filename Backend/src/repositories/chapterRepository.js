const BaseRepository = require('./baseRepository');
const Chapter = require('../models/Chapter');

class ChapterRepository extends BaseRepository {
  constructor() {
    super(Chapter);
  }

  findByCourse(courseId) {
    return this.model.find({ course: courseId }).sort('order');
  }
}

module.exports = new ChapterRepository();
