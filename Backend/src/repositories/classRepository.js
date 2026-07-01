const BaseRepository = require('./baseRepository');
const ClassModel = require('../models/Class');

class ClassRepository extends BaseRepository {
  constructor() {
    super(ClassModel);
  }

  findWithDetails(query = {}) {
    return this.model.find(query)
      .populate('course', 'title price')
      .populate('teacher', 'fullName email');
  }

  findByIdWithDetails(id) {
    return this.model.findById(id)
      .populate('course', 'title price')
      .populate('teacher', 'fullName email');
  }

  findAssignableClasses(courseId) {
    return this.model.find({
      course: courseId,
      status: 'OPEN',
      $expr: { $lt: ['$currentStudents', '$maxStudents'] }
    }).sort({ startDate: 1 });
  }

  findJoinablePaidClasses(courseId) {
    return this.model.find({
      course: courseId,
      status: 'OPEN',
      $expr: { $lt: ['$currentStudents', '$maxStudents'] }
    }).sort({ startDate: 1 });
  }
}

module.exports = new ClassRepository();
