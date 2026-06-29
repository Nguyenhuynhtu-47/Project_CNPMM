# ELMS Module Roadmap

## Module 1 - Student Enrollment, Lesson Progress, Lesson Content
Status: Done

- Allow student accounts to enroll through the enrollment API.
- Prevent duplicate enrollments for the same user and course.
- Keep payment success from creating duplicate enrollments.
- Calculate course progress from real lessons and completed lesson progress.
- Align lesson create/update payloads with the Lesson model fields.

## Module 2 - RBAC, Roles, Permissions
Status: Done

- Add Role and Permission models.
- Replace hard-coded role strings with role/permission checks.
- Align roles with Guest, Student, Teacher, Manager, Admin.
- Add admin APIs to manage roles and permissions.

## Module 3 - Repository Pattern and DTO Layer
Status: Done

- Add repositories for data access.
- Move direct Mongoose calls out of services.
- Add request and response DTOs.
- Standardize controller responses.

## Module 4 - Redis Integration
Status: Done

- Add Redis client config.
- Use Redis for OTP/rate-limit/session-related cache where appropriate.
- Add graceful fallback when Redis is unavailable in local development.

## Module 5 - Swagger / OpenAPI Documentation
Status: Done

- Add Swagger UI endpoint.
- Document auth, course, class, enrollment, payment, lesson, quiz, notification APIs.
- Add request/response schemas.

## Module 6 - Frontend Required Stack Migration
Status: Done

- Add Redux Toolkit store and slices.
- Move auth/course/enrollment state into Redux where useful.
- Add TailwindCSS.
- Add React Hook Form and Yup validation for auth/profile forms.
- Use Redux state in the Courses page.
- Use React Hook Form and Yup in Login and Register.
- Use SwiperJS on Home and Recharts on Admin Dashboard.

## Module 7 - Admin, Manager, Teacher Dashboards
Status: Done

- Add admin course/class/user/payment management pages.
- Add manager student/teacher/class/enrollment/payment pages.
- Add teacher assigned classes, students, quizzes, assignments, class statistics.
- Add Admin, Manager, and Teacher dashboard routes with statistics and operational summaries.

## Module 8 - Assignment and Submission
Status: Done

- Add Assignment and Submission models.
- Add teacher APIs to create assignments.
- Add student APIs to submit assignments.
- Add grading and feedback.

## Module 9 - Reviews, Wishlist, Discussion
Status: Done

- Add course reviews with enrolled-student validation.
- Add wishlist APIs and UI.
- Add class discussion posts/comments and teacher pinning.

## Module 10 - Certificates and Attendance
Status: Done

- Add attendance tracking.
- Generate certificate PDFs.
- Add QR verification endpoint.
- Enforce completion and final score rules.
- Add certificate PDF download endpoint and QR-backed verification URL.

## Module 11 - Statistics, Reports, Charts
Status: Done

- Add revenue, enrollment, completion, top courses, top teachers APIs.
- Add ChartJS or Recharts dashboard charts.
- Add date range filters.

## Module 12 - Public Home Enhancements
Status: Done

- Add banners and settings.
- Add featured/new/upcoming/best-selling courses.
- Add SwiperJS sections.
- Load dynamic banners and multiple public course sections on Home.
