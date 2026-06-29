const PERMISSIONS = [
  { code: 'USER_READ', name: 'Read users', module: 'USER' },
  { code: 'USER_MANAGE', name: 'Manage users', module: 'USER' },
  { code: 'ROLE_MANAGE', name: 'Manage roles and permissions', module: 'ROLE' },
  { code: 'COURSE_READ', name: 'Read courses', module: 'COURSE' },
  { code: 'COURSE_MANAGE', name: 'Manage courses', module: 'COURSE' },
  { code: 'CLASS_READ', name: 'Read classes', module: 'CLASS' },
  { code: 'CLASS_MANAGE', name: 'Manage classes', module: 'CLASS' },
  { code: 'ENROLLMENT_READ', name: 'Read enrollments', module: 'ENROLLMENT' },
  { code: 'ENROLLMENT_MANAGE', name: 'Manage enrollments', module: 'ENROLLMENT' },
  { code: 'PAYMENT_READ', name: 'Read payments', module: 'PAYMENT' },
  { code: 'PAYMENT_MANAGE', name: 'Manage payments', module: 'PAYMENT' },
  { code: 'LESSON_READ', name: 'Read lessons', module: 'LESSON' },
  { code: 'LESSON_MANAGE', name: 'Manage lessons', module: 'LESSON' },
  { code: 'QUIZ_READ', name: 'Read quizzes', module: 'QUIZ' },
  { code: 'QUIZ_MANAGE', name: 'Manage quizzes', module: 'QUIZ' },
  { code: 'ASSIGNMENT_READ', name: 'Read assignments', module: 'ASSIGNMENT' },
  { code: 'ASSIGNMENT_MANAGE', name: 'Manage assignments', module: 'ASSIGNMENT' },
  { code: 'SUBMISSION_MANAGE', name: 'Manage submissions', module: 'ASSIGNMENT' },
  { code: 'REVIEW_MANAGE', name: 'Manage reviews', module: 'REVIEW' },
  { code: 'DISCUSSION_MANAGE', name: 'Manage class discussions', module: 'DISCUSSION' },
  { code: 'CERTIFICATE_MANAGE', name: 'Manage certificates', module: 'CERTIFICATE' },
  { code: 'ATTENDANCE_READ', name: 'Read attendance', module: 'ATTENDANCE' },
  { code: 'ATTENDANCE_MANAGE', name: 'Manage attendance', module: 'ATTENDANCE' },
  { code: 'BANNER_MANAGE', name: 'Manage banners', module: 'BANNER' },
  { code: 'SETTING_MANAGE', name: 'Manage settings', module: 'SYSTEM' },
  { code: 'REPORT_READ', name: 'Read reports', module: 'REPORT' },
  { code: 'SYSTEM_MANAGE', name: 'Manage system settings', module: 'SYSTEM' }
];

const ROLE_DEFINITIONS = [
  {
    code: 'STUDENT',
    name: 'Student',
    description: 'Learns online, enrolls in courses, takes quizzes, and tracks progress.',
    permissions: ['COURSE_READ', 'CLASS_READ', 'ENROLLMENT_READ', 'LESSON_READ', 'QUIZ_READ', 'ASSIGNMENT_READ', 'ATTENDANCE_READ']
  },
  {
    code: 'TEACHER',
    name: 'Teacher',
    description: 'Manages assigned classes, lessons, quizzes, and student progress.',
    permissions: ['COURSE_READ', 'CLASS_READ', 'ENROLLMENT_READ', 'LESSON_READ', 'LESSON_MANAGE', 'QUIZ_READ', 'QUIZ_MANAGE', 'ASSIGNMENT_READ', 'ASSIGNMENT_MANAGE', 'SUBMISSION_MANAGE', 'DISCUSSION_MANAGE', 'ATTENDANCE_READ', 'ATTENDANCE_MANAGE']
  },
  {
    code: 'MANAGER',
    name: 'Manager',
    description: 'Manages students, teachers, classes, enrollments, payments, and reports.',
    permissions: [
      'USER_READ',
      'COURSE_READ',
      'CLASS_READ',
      'CLASS_MANAGE',
      'ENROLLMENT_READ',
      'ENROLLMENT_MANAGE',
      'PAYMENT_READ',
      'PAYMENT_MANAGE',
      'REVIEW_MANAGE',
      'CERTIFICATE_MANAGE',
      'ATTENDANCE_READ',
      'ATTENDANCE_MANAGE',
      'BANNER_MANAGE',
      'REPORT_READ'
    ]
  },
  {
    code: 'ADMIN',
    name: 'Admin',
    description: 'Has full system access.',
    permissions: PERMISSIONS.map((permission) => permission.code)
  }
];

const ROLE_ALIASES = {
  USER: 'STUDENT'
};

module.exports = {
  PERMISSIONS,
  ROLE_DEFINITIONS,
  ROLE_ALIASES
};
