const mongoose = require('mongoose');
const BaseRepository = require('./baseRepository');
const Enrollment = require('../models/Enrollment');

const enrollmentPopulate = (query) => query
  .populate('user', 'fullName email')
  .populate('course', 'title price')
  .populate({
    path: 'class',
    populate: [{ path: 'course', select: 'title' }, { path: 'teacher', select: 'fullName email' }]
  });

const toObjectId = (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

class EnrollmentRepository extends BaseRepository {
  constructor() {
    super(Enrollment);
  }

  findActiveByUserAndCourse(userId, courseId) {
    const userObjectId = toObjectId(userId);
    const courseObjectId = toObjectId(courseId);
    if (!userObjectId || !courseObjectId) return null;

    return this.model.findOne({
      user: { $eq: userObjectId },
      course: { $eq: courseObjectId },
      status: { $ne: 'CANCELLED' }
    });
  }

  findUnfinishedByUserAndCourse(userId, courseId) {
    const userObjectId = toObjectId(userId);
    const courseObjectId = toObjectId(courseId);
    if (!userObjectId || !courseObjectId) return null;

    return this.model.findOne({
      user: { $eq: userObjectId },
      course: { $eq: courseObjectId },
      status: { $in: ['WAITING_CLASS', 'ASSIGNED_CLASS', 'LEARNING'] }
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
