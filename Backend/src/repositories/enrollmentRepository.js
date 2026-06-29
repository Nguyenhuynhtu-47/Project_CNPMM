const BaseRepository = require('./baseRepository');
const Enrollment = require('../models/Enrollment');

const enrollmentPopulate = (query) => query
  .populate('user', 'fullName email')
  .populate('course', 'title price')
  .populate({
    path: 'class',
    populate: [{ path: 'course', select: 'title' }, { path: 'teacher', select: 'fullName email' }]
  });

class EnrollmentRepository extends BaseRepository {
  constructor() {
    super(Enrollment);
  }

  findActiveByUserAndCourse(userId, courseId) {
    return this.model.findOne({
      user: userId,
      course: courseId,
      status: { $ne: 'CANCELLED' }
    });
  }

  findByUserAndCourse(userId, courseId) {
    return this.model.findOne({ user: userId, course: courseId });
  }

  findByIdWithDetails(id) {
    return enrollmentPopulate(this.model.findById(id));
  }

  findByUserWithDetails(userId) {
    return enrollmentPopulate(this.model.find({ user: userId }));
  }

  findAllWithDetails(filter = {}) {
    return enrollmentPopulate(this.model.find(filter).sort({ createdAt: -1 }));
  }
}

module.exports = new EnrollmentRepository();
