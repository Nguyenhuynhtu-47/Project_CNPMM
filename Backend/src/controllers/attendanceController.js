const Attendance = require('../models/Attendance');
const { canAccessClass, canManageClass } = require('../utils/classAccess');
const { normalizeRoleCode } = require('../service/rbacService');

const getRole = (req) => normalizeRoleCode(req.user?.roleRef?.code || req.user?.role);

const markAttendance = async (req, res) => {
  try {
    const classId = req.body.class;
    const markingAnotherUser = req.body.user && String(req.body.user) !== String(req.user._id);
    const allowed = markingAnotherUser
      ? await canManageClass(req.user, classId)
      : await canAccessClass(req.user, classId);
    if (!allowed) return res.status(403).json({ message: 'You cannot mark attendance for this class' });

    const watchedPercent = Number(req.body.watchedPercent || 0);
    const method = req.body.method || 'ONLINE_CLASS';
    const attended = method === 'VIDEO_WATCH' ? watchedPercent >= 80 : Boolean(req.body.attended ?? true);

    const attendance = await Attendance.findOneAndUpdate(
      {
        user: req.body.user || req.user._id,
        class: req.body.class,
        lesson: req.body.lesson || null
      },
      {
        user: req.body.user || req.user._id,
        class: req.body.class,
        lesson: req.body.lesson || null,
        method,
        watchedPercent,
        attended,
        attendedAt: new Date(),
        note: req.body.note
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'fullName email').populate('class', 'code').populate('lesson', 'title');

    return res.status(200).json({ message: 'Attendance saved', attendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot save attendance' });
  }
};

const listAttendance = async (req, res) => {
  try {
    const query = {};
    if (req.query.class) query.class = req.query.class;
    if (req.query.user) query.user = req.query.user;
    if (req.query.class) {
      const allowed = await canAccessClass(req.user, req.query.class);
      if (!allowed) return res.status(403).json({ message: 'You cannot access this class attendance' });
      if (!['ADMIN', 'MANAGER', 'TEACHER'].includes(getRole(req))) query.user = req.user._id;
    } else if (!['ADMIN', 'MANAGER'].includes(getRole(req))) {
      query.user = req.user._id;
    }

    const attendances = await Attendance.find(query)
      .populate('user', 'fullName email')
      .populate('class', 'code')
      .populate('lesson', 'title')
      .sort({ attendedAt: -1 });

    return res.status(200).json({ attendances });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load attendance' });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const attendances = await Attendance.find({ user: req.user._id })
      .populate('class', 'code')
      .populate('lesson', 'title')
      .sort({ attendedAt: -1 });

    return res.status(200).json({ attendances });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load attendance' });
  }
};

const getAttendanceSummary = async (req, res) => {
  try {
    const match = {};
    if (req.query.class) match.class = req.query.class;
    if (req.query.user) match.user = req.query.user;
    if (req.query.class) {
      const allowed = await canAccessClass(req.user, req.query.class);
      if (!allowed) return res.status(403).json({ message: 'You cannot access this class attendance' });
      if (!['ADMIN', 'MANAGER', 'TEACHER'].includes(getRole(req))) match.user = req.user._id;
    } else if (!['ADMIN', 'MANAGER'].includes(getRole(req))) {
      match.user = req.user._id;
    }

    const summary = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: { user: '$user', class: '$class' },
          totalRecords: { $sum: 1 },
          attendedRecords: { $sum: { $cond: ['$attended', 1, 0] } },
          averageWatchedPercent: { $avg: '$watchedPercent' }
        }
      },
      {
        $project: {
          user: '$_id.user',
          class: '$_id.class',
          totalRecords: 1,
          attendedRecords: 1,
          attendanceRate: {
            $cond: [
              { $eq: ['$totalRecords', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$attendedRecords', '$totalRecords'] }, 100] }, 0] }
            ]
          },
          averageWatchedPercent: { $round: ['$averageWatchedPercent', 0] },
          _id: 0
        }
      }
    ]);

    return res.status(200).json({ summary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load attendance summary' });
  }
};

module.exports = {
  markAttendance,
  listAttendance,
  getMyAttendance,
  getAttendanceSummary
};
