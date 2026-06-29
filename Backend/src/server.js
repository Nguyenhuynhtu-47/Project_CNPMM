const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(requestLogger);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const courseRoutes = require('./routes/courseRoutes');
const classRoutes = require('./routes/classRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const quizRoutes = require('./routes/quizRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const rbacRoutes = require('./routes/rbacRoutes');
const healthRoutes = require('./routes/healthRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const commentRoutes = require('./routes/commentRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const siteRoutes = require('./routes/siteRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const http = require('http');
const { Server } = require('socket.io');
const { setIo } = require('./utils/socket');
const { connectRedis } = require('./config/redis');

connectRedis();

app.use('/api/auth', authRoutes);
app.use('/api/user', profileRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/teacher', teacherRoutes);

app.get("/", (req, res) => {
    res.send("API Running");
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
setIo(io);

require("./jobs/enrollmentCron");
require("./jobs/orderExpirationCron");

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('join', (userId) => {
        if (userId) socket.join(`user:${userId}`);
    });
});

server.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
});
