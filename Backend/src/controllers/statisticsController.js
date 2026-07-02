const User = require('../models/User');
const Course = require('../models/Course');
const ClassModel = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Order = require('../models/Order');

const getDateMatch = (field = 'createdAt', query = {}) => {
  const range = {};
  if (query.from) range.$gte = new Date(query.from);
  if (query.to) range.$lte = new Date(query.to);
  return Object.keys(range).length ? { [field]: range } : {};
};

const getOverview = async (req, res) => {
  try {
    const orderDateMatch = getDateMatch('createdAt', req.query);
    const commonDateMatch = getDateMatch('createdAt', req.query);

    const [revenueAgg, newStudents, registrations, classes, completionAgg, topCourses, paymentStatus, enrollmentStatus, classStatus, topTeachers] = await Promise.all([
      Order.aggregate([
        { $match: { status: 'PAID', ...orderDateMatch } },
        { $group: { _id: null, revenue: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ role: 'STUDENT', ...commonDateMatch }),
      Enrollment.countDocuments(commonDateMatch),
      ClassModel.countDocuments(commonDateMatch),
      Enrollment.aggregate([
        { $match: commonDateMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } }
          }
        }
      ]),
      Order.aggregate([
        { $match: { status: 'PAID', ...orderDateMatch } },
        { $group: { _id: '$course', totalSales: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $project: { courseId: '$_id', title: '$course.title', totalSales: 1, revenue: 1, _id: 0 } }
      ]),
      Order.aggregate([
        { $match: orderDateMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      Enrollment.aggregate([
        { $match: commonDateMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      ClassModel.aggregate([
        { $match: commonDateMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      ClassModel.aggregate([
        { $match: commonDateMatch },
        { $group: { _id: '$teacher', classCount: { $sum: 1 }, currentStudents: { $sum: '$currentStudents' } } },
        { $sort: { currentStudents: -1, classCount: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacher' } },
        { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
        { $project: { teacherId: '$_id', fullName: '$teacher.fullName', email: '$teacher.email', classCount: 1, currentStudents: 1, _id: 0 } }
      ])
    ]);

    const totalCourses = await Course.countDocuments();

    return res.status(200).json({
      revenue: revenueAgg[0]?.revenue || 0,
      newStudents,
      registrations,
      classes,
      totalCourses,
      completionRate: completionAgg[0]?.total ? Math.round((completionAgg[0].completed / completionAgg[0].total) * 100) : 0,
      topCourses,
      topTeachers,
      statusBreakdown: {
        payments: paymentStatus,
        enrollments: enrollmentStatus,
        classes: classStatus
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load statistics' });
  }
};

module.exports = {
  getOverview
};
