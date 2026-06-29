# ELMS Business Flows

This document describes the main business flows of the English Learning Management System.

## 1. Account Registration And Email OTP Verification

**Actor:** Guest

**Goal:** Create a student account and activate it by email OTP.

**Preconditions:**

- Guest has an email address.
- Email SMTP configuration is valid.
- Redis is available or MongoDB fallback is active.

**Flow:**

1. Guest opens the Register page.
2. Guest enters email, password, and confirm password.
3. Frontend validates email format and password confirmation.
4. Frontend calls `POST /api/auth/register`.
5. Backend checks whether email already exists.
6. Backend hashes password with bcrypt.
7. Backend creates inactive student account.
8. Backend generates OTP.
9. Backend stores OTP in Redis with TTL 5 minutes and MongoDB fallback.
10. Backend sends OTP email.
11. Guest opens Verify OTP page.
12. Guest submits email and OTP.
13. Frontend calls `POST /api/auth/verify-otp`.
14. Backend verifies OTP.
15. Backend activates account and consumes OTP.

**Result:**

- User status becomes `ACTIVE`.
- User can login.

**Failure Cases:**

- Email already exists.
- OTP invalid.
- OTP expired.
- Email sending fails.

## 2. Login, Refresh Token, Logout

**Actor:** Student, Teacher, Manager, Admin

**Goal:** Authenticate and access protected pages.

**Flow:**

1. User opens Login page.
2. User enters email and password.
3. Frontend validates form with React Hook Form and Yup.
4. Frontend calls `POST /api/auth/login`.
5. Backend checks credentials and active status.
6. Backend creates JWT access token and refresh token.
7. Frontend stores token, refresh token, and user info.
8. Redux auth state is updated.
9. User accesses protected routes.
10. Axios attaches Bearer token to API requests.
11. If access token expires, Axios calls `POST /api/auth/refresh-token`.
12. Backend validates refresh token and issues new tokens.
13. On logout, frontend calls `POST /api/auth/logout` and clears local auth state.

**Result:**

- User is authenticated and routed to role-appropriate screens.

## 3. RBAC Role And Permission Flow

**Actor:** Admin

**Goal:** Manage access control.

**Flow:**

1. Admin logs in.
2. Admin opens RBAC management UI.
3. Frontend calls `GET /api/rbac/roles` and `GET /api/rbac/permissions`.
4. Admin creates or updates role permissions.
5. Frontend calls RBAC APIs.
6. Backend validates Admin role and `ROLE_MANAGE` permission.
7. Backend updates role/permission mappings.
8. Admin assigns role to user.
9. Backend updates `User.role` and `User.roleRef`.

**Result:**

- User authorization is controlled by role and permission.

## 4. Course Browsing, Search, Filter, Sorting

**Actor:** Guest or authenticated user

**Goal:** Browse available courses.

**Flow:**

1. User opens Home or Courses page.
2. Frontend calls `GET /api/courses`.
3. User applies search/category/price/sort filters.
4. Frontend sends query params:
   - `q`
   - `category`
   - `minPrice`
   - `maxPrice`
   - `sort`
   - `page`
   - `limit`
5. Backend builds query and pagination.
6. Backend returns course list and pagination metadata.
7. Frontend renders course cards.

**Result:**

- User can discover courses and open course detail.

## 5. Course And Class Management

**Actor:** Admin, Manager

**Goal:** Create and manage courses/classes.

**Course Flow:**

1. Admin opens Course Management page.
2. Admin creates or updates course information:
   - title
   - description
   - price
   - category
   - duration
   - session count
   - image
   - status
3. Frontend calls course APIs.
4. Backend checks `COURSE_MANAGE`.
5. Backend persists course data.

**Class Flow:**

1. Admin or Manager opens Class Management page.
2. User creates class for a course.
3. User assigns teacher.
4. User sets start date, end date, max students, status.
5. Frontend calls class APIs.
6. Backend checks `CLASS_MANAGE`.
7. Backend persists class data.

**Result:**

- Courses can have multiple classes.
- Teachers are assigned to classes.

## 6. Student Enrollment And Payment

**Actor:** Student

**Goal:** Enroll in a course and pay online.

**Flow:**

1. Student opens course detail.
2. Student clicks Checkout with VNPAY.
3. Frontend calls `POST /api/payments/vnpay`.
4. Backend creates pending order.
5. Backend sets `expiresAt` to 30 minutes after order creation.
6. Backend builds signed VNPAY URL.
7. Frontend redirects student to VNPAY.
8. Student completes payment.
9. VNPAY redirects to `GET /api/payments/vnpay-return`.
10. Backend verifies secure hash.
11. Backend checks whether order is still pending and not expired.
12. Backend marks order as `PAID`.
13. Backend runs class assignment algorithm.
14. Backend creates enrollment.

**Result:**

- Student receives enrollment.
- Student is assigned to class or waiting list.

**Failure Cases:**

- VNPAY signature invalid.
- Payment failed.
- Course not found.
- No suitable class found.
- Payment is not completed within 30 minutes, so order becomes `CANCELLED`.

## 6.1 Pending Order Auto-Cancellation Flow

**Actor:** System

**Trigger:** Cron job runs every minute.

**Goal:** Cancel unpaid orders after 30 minutes.

**Flow:**

1. Student creates an order through checkout.
2. Backend stores order as `PENDING`.
3. Backend sets `expiresAt = createdAt + 30 minutes`.
4. Cron job scans pending orders every minute.
5. If `expiresAt <= now`, backend updates order:
   - `status = CANCELLED`
   - `cancelledAt = now`
   - `cancelReason = PAYMENT_TIMEOUT`
6. Backend sends notification to the user.
7. If VNPAY callback arrives after cancellation, backend rejects it and does not assign class.

**Result:**

- Unpaid orders are automatically cancelled.
- Expired orders cannot become paid later.

## 7. Automatic Class Assignment

**Actor:** System

**Trigger:** Successful payment.

**Rules:**

1. Find classes under the paid course.
2. Exclude full classes.
3. Prefer class with nearest start date.
4. If class already started, allow only if less than 20% of course period has passed.
5. If no class is suitable, enrollment status becomes `WAITING_CLASS`.

**Statuses:**

- `WAITING_CLASS`
- `ASSIGNED_CLASS`
- `LEARNING`
- `COMPLETED`
- `CANCELLED`

**Result:**

- Student is assigned automatically or placed on waiting list.

## 8. Learning Content Management

**Actor:** Teacher, Admin

**Goal:** Build course curriculum.

**Flow:**

1. Teacher opens assigned course/class content.
2. Teacher creates chapters.
3. Teacher creates lessons under chapters.
4. Teacher uploads lesson media:
   - video
   - audio
   - PDF
   - DOCX
   - PPT
5. Backend uploads file to Cloudinary.
6. Backend stores `contentUrl` and `contentType`.

**Result:**

- Students can access structured lessons.

## 9. Lesson Progress Tracking

**Actor:** Student

**Goal:** Track learning progress.

**Flow:**

1. Student opens lesson.
2. Student completes lesson or watches required video percentage.
3. Frontend calls `POST /api/lessons/:id/complete`.
4. Backend checks course/chapter relationship.
5. Backend creates `LessonProgress`.
6. Backend recalculates course progress.
7. Backend updates enrollment progress and status.

**Result:**

- Course progress is updated.
- Enrollment may become `COMPLETED`.

## 10. Quiz And Test Flow

**Actor:** Teacher, Student

**Teacher Flow:**

1. Teacher creates quiz for course.
2. Teacher configures questions:
   - multiple choice
   - essay
3. Teacher sets duration and attempts.
4. Backend stores quiz.

**Student Flow:**

1. Student opens quiz list.
2. Student starts quiz attempt.
3. Frontend calls `POST /api/quizzes/:id/start`.
4. Student submits answers.
5. Frontend calls `POST /api/quizzes/:id/submit`.
6. Backend auto-grades multiple choice.
7. Backend stores quiz result.
8. Backend sends notification.

**Result:**

- Student receives score and pass/fail status.

## 11. Assignment And Submission Flow

**Actor:** Teacher, Student

**Teacher Flow:**

1. Teacher creates assignment.
2. Teacher attaches description/file/due date.
3. Backend stores assignment.

**Student Flow:**

1. Student opens assignment.
2. Student submits text and/or file URL.
3. Backend stores submission.

**Grading Flow:**

1. Teacher opens submissions.
2. Teacher enters score and feedback.
3. Backend marks submission as `GRADED`.

**Result:**

- Student can view grade and feedback.

## 12. Attendance Flow

**Actor:** Student, Teacher, System

**Goal:** Record attendance.

**Online Class Attendance:**

1. Teacher or system marks student attended.
2. Backend stores attendance method `ONLINE_CLASS`.

**Video Watch Attendance:**

1. Student watches video lesson.
2. Frontend tracks watched percentage.
3. If watched percentage is over 80%, frontend calls attendance API.
4. Backend stores method `VIDEO_WATCH` and marks attended.

**Result:**

- Attendance history is available by class/student.

## 13. Certificate Flow

**Actor:** Student, Manager/Admin/System

**Goal:** Issue certificate after completion.

**Rules:**

- Course progress must be 100%.
- Final score must be at least 70.

**Flow:**

1. Manager/Admin requests certificate issue for an enrollment.
2. Backend validates enrollment.
3. Backend validates progress and final score.
4. Backend generates certificate code.
5. Backend generates verification URL.
6. Backend generates QR code.
7. Backend generates PDF certificate.
8. Backend stores certificate metadata.
9. Student can list/download certificate.
10. Anyone can verify certificate by code.

**Result:**

- Certificate is issued with QR-backed verification.

## 14. Course Review Flow

**Actor:** Student

**Goal:** Review a course after enrollment.

**Flow:**

1. Student opens course review form.
2. Student enters rating 1-5 and content.
3. Frontend calls review API.
4. Backend checks that student has active enrollment.
5. Backend creates or updates review.
6. Backend gives reward point/coupon metadata.

**Result:**

- Public course reviews are displayed.

## 15. Wishlist Flow

**Actor:** Student

**Goal:** Save courses for later.

**Flow:**

1. Student clicks Add to Wishlist.
2. Frontend calls wishlist API.
3. Backend upserts wishlist item.
4. Student opens Wishlist page.
5. Frontend loads saved courses.
6. Student can remove a course.

**Result:**

- Student can manage favorite courses.

## 16. Class Discussion Flow

**Actor:** Student, Teacher

**Goal:** Discuss inside class forum.

**Flow:**

1. Student posts a question in class discussion.
2. Other students or teacher reply.
3. Backend stores comments.
4. Teacher can pin important comments.

**Result:**

- Each class has a discussion thread with pinned teacher responses.

## 17. Realtime Notification Flow

**Actor:** System, User

**Goal:** Notify users in realtime and through stored notifications.

**Flow:**

1. User logs in and frontend connects to Socket.IO.
2. Frontend emits `join` with user id.
3. Backend joins socket to room `user:{id}`.
4. Business service creates notification.
5. Backend stores notification in MongoDB.
6. Backend emits realtime notification to user room.
7. Frontend displays notification.

**Events:**

- Registration
- Payment success
- Class assignment
- New lesson
- New quiz
- New comment
- Quiz submitted

## 18. Public Home Flow

**Actor:** Guest, Student

**Goal:** Discover platform and course offerings.

**Flow:**

1. User opens Home.
2. Frontend loads active banners.
3. Frontend loads course sections:
   - newest courses
   - best value courses
   - premium courses
4. Frontend renders Swiper sliders.
5. User opens course detail.

**Result:**

- Home page is dynamic and content-managed.

## 19. Admin Dashboard Flow

**Actor:** Admin

**Goal:** Monitor and manage whole system.

**Flow:**

1. Admin opens `/admin`.
2. Frontend calls statistics API.
3. Backend returns revenue, students, registrations, classes, completion rate, top courses.
4. Frontend renders cards and Recharts chart.
5. Admin navigates to management pages.

**Result:**

- Admin gets system overview and management entry point.

## 20. Manager Dashboard Flow

**Actor:** Manager

**Goal:** Monitor operations.

**Flow:**

1. Manager opens `/manager`.
2. Frontend loads statistics, orders, classes.
3. Manager reviews revenue, registrations, class count, order count.
4. Manager uses report chart to inspect best-selling courses.

**Result:**

- Manager can track operations and reports.

## 21. Teacher Dashboard Flow

**Actor:** Teacher

**Goal:** Manage teaching workload.

**Flow:**

1. Teacher opens `/teacher`.
2. Frontend loads classes, assignments, attendance.
3. Teacher reviews class count and recent assignments.
4. Teacher proceeds to manage lessons, assignments, submissions, and attendance.

**Result:**

- Teacher has a dedicated operational dashboard.

## 22. Reporting Flow

**Actor:** Admin, Manager

**Goal:** View business statistics.

**Flow:**

1. Admin/Manager opens report dashboard.
2. Frontend calls `GET /api/statistics/overview`.
3. Backend aggregates:
   - revenue
   - student count
   - registrations
   - class count
   - total courses
   - average completion
   - top courses
4. Frontend renders data cards and charts.

**Result:**

- Admin/Manager can make operational decisions from system data.

## 23. Deployment Flow

**Actor:** Developer/Admin

**Goal:** Run and deploy the system.

**Flow:**

1. Install backend dependencies.
2. Configure backend `.env`.
3. Start MongoDB and Redis.
4. Seed database.
5. Start backend.
6. Install frontend dependencies.
7. Configure frontend API base URL.
8. Build frontend.
9. Deploy backend and frontend.
10. Verify:
   - API health
   - Swagger
   - login
   - course list
   - payment sandbox
   - dashboards

**Result:**

- ELMS is ready for demonstration or production hardening.
