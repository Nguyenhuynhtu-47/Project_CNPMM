const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 8080;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ELMS API',
      version: '1.0.0',
      description: 'English Learning Management System API documentation'
    },
    servers: [
      {
        url: API_BASE_URL,
        description: 'Current API server'
      }
    ],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Profile' },
      { name: 'Courses' },
      { name: 'Classes' },
      { name: 'Lessons' },
      { name: 'Quizzes' },
      { name: 'Enrollments' },
      { name: 'Orders' },
      { name: 'Payments' },
      { name: 'Notifications' },
      { name: 'RBAC' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'MANAGER', 'ADMIN'] },
            permissions: { type: 'array', items: { type: 'string' } },
            fullName: { type: 'string' },
            avatar: { type: 'string' }
          }
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            imageUrl: { type: 'string' },
            category: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Category' }] },
            durationWeeks: { type: 'number' },
            sessionCount: { type: 'number' },
            status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' }
          }
        },
        Class: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string' },
            course: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Course' }] },
            teacher: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            maxStudents: { type: 'number' },
            currentStudents: { type: 'number' },
            status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'] }
          }
        },
        Chapter: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            course: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            order: { type: 'number' }
          }
        },
        Lesson: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            chapter: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            contentType: { type: 'string', enum: ['VIDEO', 'PDF', 'DOCX', 'PPT', 'AUDIO', 'ASSIGNMENT', 'QUIZ', 'ARTICLE'] },
            contentUrl: { type: 'string' },
            durationMinutes: { type: 'number' },
            order: { type: 'number' },
            published: { type: 'boolean' }
          }
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }] },
            course: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Course' }] },
            class: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Class' }] },
            status: { type: 'string', enum: ['WAITING_CLASS', 'ASSIGNED_CLASS', 'LEARNING', 'COMPLETED', 'CANCELLED'] },
            progress: { type: 'number' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            course: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Course' }] },
            class: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Class' }] },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'] },
            paymentMethod: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
            cancelledAt: { type: 'string', format: 'date-time' },
            cancelReason: { type: 'string' }
          }
        },
        Quiz: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            course: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            durationMinutes: { type: 'number' },
            attemptsAllowed: { type: 'number' },
            oneAttempt: { type: 'boolean' },
            published: { type: 'boolean' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            read: { type: 'boolean' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            permissions: { type: 'array', items: { $ref: '#/components/schemas/Permission' } }
          }
        },
        Permission: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string' },
            name: { type: 'string' },
            module: { type: 'string' }
          }
        }
      }
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Check API and Redis fallback status',
          responses: {
            200: { description: 'Service status' }
          }
        }
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a student account and send OTP',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'OTP sent' },
            409: { description: 'Email already exists' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive access and refresh tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login success' },
            401: { description: 'Invalid credentials' }
          }
        }
      },
      '/api/auth/verify-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Verify registration OTP',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'otp'],
                  properties: {
                    email: { type: 'string' },
                    otp: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Account activated' } }
        }
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Send reset password OTP',
          responses: { 200: { description: 'OTP sent' } }
        }
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password with OTP',
          responses: { 200: { description: 'Password reset' } }
        }
      },
      '/api/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          responses: { 200: { description: 'Token refreshed' } }
        }
      },
      '/api/user/profile': {
        put: {
          tags: ['Profile'],
          security: [{ bearerAuth: [] }],
          summary: 'Update current user profile',
          responses: { 200: { description: 'Profile updated' } }
        }
      },
      '/api/courses': {
        get: {
          tags: ['Courses'],
          summary: 'List courses with search, filters, sorting, pagination',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'minPrice', in: 'query', schema: { type: 'number' } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'priceAsc', 'priceDesc', 'titleAsc'] } },
            { name: 'page', in: 'query', schema: { type: 'number' } },
            { name: 'limit', in: 'query', schema: { type: 'number' } }
          ],
          responses: { 200: { description: 'Course list' } }
        },
        post: {
          tags: ['Courses'],
          security: [{ bearerAuth: [] }],
          summary: 'Create course',
          responses: { 201: { description: 'Course created' } }
        }
      },
      '/api/courses/{id}': {
        get: {
          tags: ['Courses'],
          summary: 'Get course detail',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Course detail' } }
        },
        put: {
          tags: ['Courses'],
          security: [{ bearerAuth: [] }],
          summary: 'Update course',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Course updated' } }
        },
        delete: {
          tags: ['Courses'],
          security: [{ bearerAuth: [] }],
          summary: 'Delete course',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Course deleted' } }
        }
      },
      '/api/courses/categories': {
        get: { tags: ['Courses'], summary: 'List categories', responses: { 200: { description: 'Categories' } } },
        post: { tags: ['Courses'], security: [{ bearerAuth: [] }], summary: 'Create category', responses: { 201: { description: 'Category created' } } }
      },
      '/api/classes': {
        get: { tags: ['Classes'], summary: 'List classes', responses: { 200: { description: 'Classes' } } },
        post: { tags: ['Classes'], security: [{ bearerAuth: [] }], summary: 'Create class', responses: { 201: { description: 'Class created' } } }
      },
      '/api/enrollments': {
        get: { tags: ['Enrollments'], security: [{ bearerAuth: [] }], summary: 'List current user enrollments', responses: { 200: { description: 'Enrollments' } } },
        post: { tags: ['Enrollments'], security: [{ bearerAuth: [] }], summary: 'Enroll current user in a course', responses: { 201: { description: 'Enrollment created' } } }
      },
      '/api/payments/vnpay': {
        post: { tags: ['Payments'], security: [{ bearerAuth: [] }], summary: 'Create VNPAY payment URL', responses: { 200: { description: 'Payment URL' } } }
      },
      '/api/payments/vnpay-return': {
        get: { tags: ['Payments'], summary: 'VNPAY return callback', responses: { 200: { description: 'Payment verified' } } }
      },
      '/api/orders': {
        get: { tags: ['Orders'], security: [{ bearerAuth: [] }], summary: 'List current user orders', responses: { 200: { description: 'Orders' } } },
        post: { tags: ['Orders'], security: [{ bearerAuth: [] }], summary: 'Create order', responses: { 201: { description: 'Order created' } } }
      },
      '/api/chapters': {
        post: { tags: ['Lessons'], security: [{ bearerAuth: [] }], summary: 'Create chapter', responses: { 201: { description: 'Chapter created' } } }
      },
      '/api/lessons': {
        post: { tags: ['Lessons'], security: [{ bearerAuth: [] }], summary: 'Create lesson', responses: { 201: { description: 'Lesson created' } } }
      },
      '/api/lessons/{id}/complete': {
        post: {
          tags: ['Lessons'],
          security: [{ bearerAuth: [] }],
          summary: 'Mark lesson as completed',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Lesson completed' } }
        }
      },
      '/api/quizzes': {
        post: { tags: ['Quizzes'], security: [{ bearerAuth: [] }], summary: 'Create quiz', responses: { 201: { description: 'Quiz created' } } }
      },
      '/api/quizzes/course/{courseId}': {
        get: {
          tags: ['Quizzes'],
          summary: 'List quizzes by course',
          parameters: [{ name: 'courseId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Quizzes' } }
        }
      },
      '/api/quizzes/{id}/start': {
        post: { tags: ['Quizzes'], security: [{ bearerAuth: [] }], summary: 'Start quiz attempt', responses: { 201: { description: 'Attempt started' } } }
      },
      '/api/quizzes/{id}/submit': {
        post: { tags: ['Quizzes'], security: [{ bearerAuth: [] }], summary: 'Submit quiz attempt', responses: { 200: { description: 'Quiz submitted' } } }
      },
      '/api/notifications': {
        get: { tags: ['Notifications'], security: [{ bearerAuth: [] }], summary: 'List notifications', responses: { 200: { description: 'Notifications' } } }
      },
      '/api/rbac/roles': {
        get: { tags: ['RBAC'], security: [{ bearerAuth: [] }], summary: 'List roles', responses: { 200: { description: 'Roles' } } },
        post: { tags: ['RBAC'], security: [{ bearerAuth: [] }], summary: 'Create role', responses: { 201: { description: 'Role created' } } }
      },
      '/api/rbac/permissions': {
        get: { tags: ['RBAC'], security: [{ bearerAuth: [] }], summary: 'List permissions', responses: { 200: { description: 'Permissions' } } }
      }
    }
  },
  apis: []
};

module.exports = swaggerJsdoc(options);
