# ELMS TODO To Reach 100%

This checklist tracks the remaining work needed to move the ELMS project from the current near-complete state to a production-ready 100% submission.

## 1. Backend Completion

### 1.1 Refactor Remaining Modules To Repository/DTO

- [ ] Refactor `authService` to use `userRepository`, `roleRepository`, `otpRepository`, and auth DTOs.
- [ ] Refactor `quizService` to use `quizRepository` and `quizResultRepository`.
- [ ] Refactor `profileService` to use `userRepository` and profile DTOs.
- [ ] Refactor `notificationService` to use `notificationRepository`.
- [ ] Refactor `lessonController` and `chapterController` so direct Mongoose calls move into services/repositories.
- [ ] Add consistent response DTOs for:
  - [ ] Auth
  - [ ] Profile
  - [ ] Quiz
  - [ ] Assignment
  - [ ] Review
  - [ ] Wishlist
  - [ ] Certificate
  - [ ] Attendance
  - [ ] Statistics

### 1.2 Admin CRUD APIs

- [x] Add admin user management APIs:
  - [x] List users with filters by role/status/search.
  - [x] Create staff accounts.
  - [x] Update user profile/status/role.
  - [x] Lock/unlock user.
  - [x] Reset user password as admin.
- [x] Add role and permission update APIs with validation and duplicate protection.
- [x] Add banner delete/reorder APIs.
- [x] Add settings delete/read-public APIs.
- [x] Add category update/delete APIs.

### 1.3 Teacher APIs

- [x] Add API to list only classes assigned to current teacher.
- [x] Add API to list students in a teacher class.
- [x] Add teacher lesson material management:
  - [x] Upload material.
  - [x] Delete material.
  - [x] Reorder lessons.
- [x] Add teacher quiz result review API.
- [x] Add teacher assignment analytics API.

### 1.4 Manager APIs

- [x] Add manager dashboard API with:
  - [x] Student count by period.
  - [x] Teacher count.
  - [x] Class count by status.
  - [x] Payment count by status.
  - [x] Enrollment count by status.
- [x] Add date range filters to reports.
- [x] Add top teachers report.

### 1.5 Certificate And Attendance Hardening

- [x] Store certificate PDF in Cloudinary or filesystem instead of large base64 data URI in MongoDB.
- [x] Store QR image or generate QR on demand.
- [x] Add certificate revoke endpoint.
- [x] Add certificate uniqueness handling on duplicate issue attempts.
- [x] Add attendance summary by class/student/course.
- [x] Add attendance rule validation:
  - [x] Online class attendance.
  - [x] Video watch attendance over 80%.

### 1.6 Payment Hardening

- [x] Add separate `Payment` model/collection to match requirement.
- [x] Store raw VNPAY callback safely.
- [x] Add idempotency for repeated callbacks.
- [x] Add order expiration/cancel flow.
- [x] Auto-cancel pending orders after 30 minutes without payment.
- [x] Add admin/manager payment filter APIs.

### 1.7 Security And Reliability

- [x] Move secrets out of committed `.env`.
- [x] Add `.env.example`.
- [x] Restrict CORS by environment.
- [x] Add Helmet security headers.
- [x] Add request logging.
- [x] Add global error handler middleware.
- [x] Add centralized async handler wrapper.
- [ ] Validate all ObjectId params consistently.
- [x] Add file upload size/type limits.
- [x] Run `npm audit` and fix vulnerabilities without breaking dependencies.

## 2. Frontend Completion

- [x] Create Admin management console route.
- [x] Create Admin layout/sidebar.
- [x] User management page:
  - [x] List users.
  - [x] Search/filter users in UI.
  - [x] Update status.
  - [x] Update role in UI.
  - [x] Create staff account.
- [x] Role and permission management page.
- [x] Course management page:
  - [x] Create/delete course.
  - [x] Update course form in UI.
  - [x] Upload course image.
  - [x] Manage category.
- [x] Class management page:
  - [x] Create/delete class.
  - [x] Update class form in UI.
  - [x] Assign teacher.
  - [x] View class students.
- [x] Banner management page.
- [x] Settings management page.
- [x] Payment management page.
- [x] Notification management page.

### 2.2 Manager UI

- [x] Manager dashboard with date range filters.
- [x] Student management page.
- [x] Teacher management page.
- [x] Enrollment management page.
- [x] Payment/report page.
- [x] Class status tracking page.

### 2.3 Teacher UI

- [x] Teacher assigned classes page.
- [x] Class student list page.
- [x] Chapter/lesson management UI.
- [x] Material upload UI.
- [x] Quiz create/edit UI.
  - [x] Quiz create UI.
  - [x] Quiz edit UI.
- [x] Assignment create/edit UI.
  - [x] Assignment create UI.
  - [x] Assignment edit UI.
- [x] Submission grading UI.
- [x] Attendance management UI.
- [x] Class discussion moderation UI.

### 2.4 Student UI

- [x] My learning page with enrolled classes.
- [x] Lesson player page:
  - [x] Video/PDF/audio display.
  - [x] Mark lesson complete.
  - [x] Track watch percentage.
- [x] Wishlist page.
- [x] Review submission UI.
- [x] Discussion UI for class forum.
- [x] Assignment submission UI.
- [x] Certificate list/download page.
- [x] Attendance history page.

### 2.5 Frontend Architecture

- [ ] Move more API state to Redux Toolkit:
  - [ ] Auth
  - [ ] Courses
  - [ ] Enrollments
  - [ ] Notifications
  - [ ] Dashboard stats
- [ ] Add Redux async thunks or RTK Query.
- [ ] Standardize loading/error/empty states.
- [x] Add route guards by role/permission.
- [x] Add code splitting for heavy pages using `React.lazy`.
- [x] Reduce bundle size warning from Recharts/Swiper.
- [x] Replace remaining mojibake text with clean Vietnamese or English.

## 3. Documentation Completion

- [ ] Write Business Requirement Specification.
- [ ] Write Software Requirement Specification.
- [ ] Add Use Case Diagram.
- [ ] Add Activity Diagrams.
- [ ] Add Sequence Diagrams.
- [ ] Add ERD.
- [ ] Add Class Diagram.
- [ ] Add MongoDB Schema Design.
- [ ] Add REST API Design document.
- [ ] Expand Swagger docs for every new API:
  - [ ] Assignment
  - [ ] Submission
  - [ ] Review
  - [ ] Wishlist
  - [ ] Discussion
  - [ ] Attendance
  - [ ] Certificate
  - [ ] Banner
  - [ ] Settings
  - [ ] Statistics
- [ ] Add screenshots or screen descriptions for all frontend pages.
- [ ] Add deployment guide for local, staging, production.

## 4. Testing

### 4.1 Backend Tests

- [ ] Add Jest or Vitest backend test setup.
- [ ] Add auth tests.
- [ ] Add RBAC tests.
- [ ] Add course/class tests.
- [ ] Add enrollment auto assignment tests.
- [ ] Add payment callback tests.
- [ ] Add quiz grading tests.
- [ ] Add assignment/submission tests.
- [ ] Add certificate rule tests.
- [ ] Add attendance rule tests.

### 4.2 Frontend Tests

- [ ] Add React Testing Library setup.
- [ ] Test Login/Register validation.
- [ ] Test protected routes.
- [ ] Test course list filters.
- [ ] Test dashboard rendering.
- [ ] Test key student flows.

### 4.3 End-To-End Tests

- [ ] Add Playwright or Cypress.
- [ ] Test register -> verify OTP -> login.
- [ ] Test course checkout happy path with mocked payment.
- [ ] Test lesson completion and progress update.
- [ ] Test quiz submission.
- [ ] Test assignment submission/grading.

## 5. Production Readiness

- [x] Add Dockerfile for backend.
- [x] Add Dockerfile for frontend.
- [x] Add docker-compose for MongoDB, Redis, backend, frontend.
- [x] Add CI workflow:
  - [x] Install dependencies.
  - [x] Lint.
  - [x] Build.
  - [ ] Test.
- [x] Add database backup guidance.
- [x] Add monitoring/logging guidance.
- [x] Add deployment checklist.

## 6. Final Acceptance Checklist

- [ ] All modules in `MODULE_ROADMAP.md` are implemented with UI and API.
- [ ] All required technologies from `projectrequired.md` are used in real code.
- [x] Swagger documents all backend APIs.
- [x] Backend build/syntax passes.
- [x] Frontend lint passes.
- [x] Frontend production build passes.
- [x] Seed data creates Admin, Manager, Teachers, Students, Courses, Classes, Roles, Permissions.
- [x] Demo account credentials are documented.
- [x] No real secrets are committed.
- [x] The system can be run from clean clone using documentation.
