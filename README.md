# ELMS - English Learning Management System

ELMS là hệ thống quản lý học tập trực tuyến được xây dựng với kiến trúc tách riêng Frontend và Backend. Dự án tập trung vào các luồng chính của một nền tảng E-Learning: xác thực người dùng, quản lý khóa học, lớp học, nội dung học tập, ghi danh, thanh toán, quiz, assignment, chứng chỉ, thông báo và quản trị hệ thống theo phân quyền.

Frontend được xây dựng bằng React + Vite, sử dụng React Router DOM để điều hướng, Axios để gọi API và AuthContext để quản lý trạng thái đăng nhập. Backend được xây dựng bằng Node.js + Express.js, sử dụng MongoDB làm cơ sở dữ liệu chính, JWT để xác thực, RBAC để phân quyền và tích hợp một số dịch vụ như email OTP, upload tài liệu, thanh toán và thông báo thời gian thực.

## 1. Công nghệ sử dụng

### Frontend

- React
- Vite
- React Router DOM
- Axios
- Bootstrap
- Tailwind CSS
- Socket.IO Client
- Recharts
- React Hook Form
- Yup

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JSON Web Token
- Redis
- Socket.IO
- Nodemailer
- Cloudinary
- VNPay
- Swagger UI
- Node-cron

## 2. Cấu trúc thư mục chính

### `Backend/src/server.js`

Đây là file khởi động chính của Backend.

File này thực hiện các công việc:

- nạp biến môi trường
- kết nối MongoDB
- kết nối Redis nếu có
- cấu hình Express app
- bật CORS, Helmet, JSON parser
- khai báo Swagger docs
- đăng ký toàn bộ route API
- khởi tạo Socket.IO
- chạy các cron job nền
- lắng nghe server theo port cấu hình

### `Backend/src/routes/`

Chứa các file định nghĩa route API theo từng nhóm chức năng.

Một số route chính:

- `authRoutes.js`: đăng ký, đăng nhập, OTP, quên mật khẩu, refresh token
- `courseRoutes.js`: khóa học và danh mục khóa học
- `classRoutes.js`: lớp học
- `chapterRoutes.js`: chương học
- `lessonRoutes.js`: bài học và tài liệu bài học
- `quizRoutes.js`: quiz và kết quả làm bài
- `assignmentRoutes.js`: bài tập và bài nộp
- `enrollmentRoutes.js`: ghi danh và tiến độ học tập
- `orderRoutes.js`: đơn hàng
- `paymentRoutes.js`: thanh toán VNPay
- `notificationRoutes.js`: thông báo
- `rbacRoutes.js`: vai trò và quyền
- `adminUserRoutes.js`: quản trị người dùng
- `siteRoutes.js`: banner và setting hệ thống

### `Backend/src/controllers/`

Controller là nơi nhận request từ route, gọi service tương ứng và trả response về client.

Ví dụ:

- `authController.js` xử lý đăng ký, đăng nhập, xác thực OTP
- `courseController.js` xử lý khóa học và danh mục
- `lessonController.js` xử lý bài học và ghi nhận hoàn thành bài học
- `quizController.js` xử lý tạo quiz, bắt đầu làm bài và nộp bài
- `paymentController.js` xử lý preview thanh toán, tạo thanh toán VNPay và nhận kết quả thanh toán

### `Backend/src/service/`

Service chứa logic nghiệp vụ chính của hệ thống.

Controller không xử lý nghiệp vụ phức tạp trực tiếp mà gọi sang service để đảm bảo code dễ bảo trì và dễ mở rộng.

Ví dụ:

- `authService.js`: xử lý đăng ký, đăng nhập, OTP, token
- `courseService.js`: xử lý nghiệp vụ khóa học
- `enrollmentService.js`: xử lý ghi danh và tiến độ học
- `orderService.js`: xử lý đơn hàng
- `paymentService.js`: xử lý thanh toán VNPay
- `rbacService.js`: xử lý role, permission và phân quyền

### `Backend/src/models/`

Chứa các Mongoose model tương ứng với collection trong MongoDB.

Một số model quan trọng:

- `User`
- `Role`
- `Permission`
- `Course`
- `Category`
- `Class`
- `Chapter`
- `Lesson`
- `LessonProgress`
- `Quiz`
- `QuizResult`
- `Assignment`
- `Submission`
- `Enrollment`
- `Order`
- `Payment`
- `Notification`
- `Certificate`
- `Review`
- `Wishlist`
- `Banner`
- `Setting`

### `Backend/src/middleware/`

Chứa các middleware dùng chung.

Các middleware chính:

- `authMiddleware.js`: xác thực token và kiểm tra role/permission
- `validateMiddleware.js`: xử lý kết quả validate request
- `uploadMiddleware.js`: xử lý upload file
- `rateLimitMiddleware.js`: giới hạn số lần gọi API nhạy cảm
- `errorHandler.js`: xử lý lỗi tập trung
- `requestLogger.js`: ghi log request

### `Backend/src/jobs/`

Chứa các tác vụ chạy nền bằng cron.

Các job hiện có:

- xử lý enrollment
- xử lý đơn hàng hết hạn thanh toán

### `Frontend/src/App.jsx`

Đây là file khai báo route chính của Frontend.

Ứng dụng sử dụng `BrowserRouter`, `Routes` và `Route` để điều hướng giữa các màn hình.

Các route public:

- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

Các route cần đăng nhập:

- `/home`
- `/courses`
- `/courses/:id`
- `/checkout/:courseId`
- `/payment-result`
- `/enrollments`
- `/my-learning`
- `/quizzes/:id`
- `/wishlist`
- `/orders`
- `/notifications`
- `/profile`
- `/teacher`
- `/manager`
- `/admin`
- `/admin/manage`

### `Frontend/src/context/AuthContext.jsx`

Đây là nơi quản lý trạng thái xác thực của Frontend.

AuthContext lưu và đọc các thông tin:

- `token`
- `refreshToken`
- `user`
- `isAuthenticated`

Khi người dùng đăng nhập thành công, token và thông tin user được lưu vào `localStorage`. Khi đăng xuất, các thông tin này được xóa khỏi `localStorage`.

### `Frontend/src/services/api.js`

Đây là file cấu hình Axios dùng chung cho toàn bộ Frontend.

File này thực hiện:

- cấu hình `baseURL` cho API
- tự động gắn `Authorization: Bearer <token>` vào request nếu đã đăng nhập
- tự động gọi API refresh token khi access token hết hạn
- xóa dữ liệu đăng nhập nếu refresh token không hợp lệ

### `Frontend/src/services/`

Chứa các hàm gọi API được chia theo từng module.

Một số file chính:

- `auth.js`: API đăng nhập, đăng ký, OTP, quên mật khẩu
- `course.js`: API khóa học và danh mục
- `class.js`: API lớp học
- `chapter.js`: API chương học
- `lesson.js`: API bài học
- `quiz.js`: API quiz
- `assignment.js`: API bài tập
- `enrollment.js`: API ghi danh
- `order.js`: API đơn hàng
- `payment.js`: API thanh toán
- `notification.js`: API thông báo
- `rbac.js`: API role và permission
- `site.js`: API banner và setting

### `Frontend/src/pages/`

Chứa các màn hình chính của hệ thống.

Một số màn hình quan trọng:

- `Login.jsx`: đăng nhập
- `Register.jsx`: đăng ký
- `VerifyOtp.jsx`: xác thực email
- `ForgotPassword.jsx`: quên mật khẩu
- `ResetPassword.jsx`: đặt lại mật khẩu
- `Home.jsx`: trang chủ
- `Courses.jsx`: danh sách khóa học
- `CourseDetail.jsx`: chi tiết khóa học
- `Checkout.jsx`: thanh toán khóa học
- `PaymentResult.jsx`: kết quả thanh toán
- `Enrollments.jsx`: danh sách khóa học đã ghi danh
- `StudentLearning.jsx`: màn hình học tập
- `QuizTake.jsx`: làm quiz
- `Profile.jsx`: hồ sơ cá nhân
- `TeacherDashboard.jsx`: dashboard giảng viên
- `ManagerDashboard.jsx`: dashboard quản lý
- `AdminDashboard.jsx`: dashboard admin
- `AdminManagement.jsx`: quản trị dữ liệu hệ thống

## 3. Luồng hoạt động tổng quát

### 3.1 Luồng khởi động hệ thống

1. Backend được chạy trước để mở API server.
2. Backend kết nối đến MongoDB.
3. Backend đăng ký các route dưới prefix `/api`.
4. Backend khởi tạo Socket.IO để hỗ trợ thông báo realtime.
5. Frontend được chạy bằng Vite.
6. Frontend đọc API base URL từ biến môi trường.
7. Người dùng truy cập giao diện Frontend và thao tác với hệ thống.
8. Frontend gọi API đến Backend thông qua Axios.
9. Backend xử lý nghiệp vụ, truy vấn database và trả JSON response.

### 3.2 Luồng đăng ký tài khoản

File xử lý chính:

- Frontend: `Register.jsx`, `services/auth.js`
- Backend: `authRoutes.js`, `authController.js`, `authService.js`

Luồng hoạt động:

1. Guest nhập email và mật khẩu tại màn hình đăng ký.
2. Frontend gọi API đăng ký.
3. Backend kiểm tra email đã tồn tại hay chưa.
4. Backend mã hóa mật khẩu.
5. Backend tạo tài khoản mới.
6. Backend sinh OTP và gửi qua email.
7. Người dùng chuyển sang bước xác thực OTP.

### 3.3 Luồng xác thực OTP

File xử lý chính:

- Frontend: `VerifyOtp.jsx`
- Backend: `authController.js`, `otpService.js`

Luồng hoạt động:

1. Người dùng nhập email và mã OTP.
2. Frontend gửi OTP lên Backend.
3. Backend kiểm tra OTP có đúng và còn hạn hay không.
4. Nếu hợp lệ, tài khoản được kích hoạt.
5. Người dùng có thể đăng nhập vào hệ thống.

### 3.4 Luồng đăng nhập

File xử lý chính:

- Frontend: `Login.jsx`, `AuthContext.jsx`, `services/api.js`
- Backend: `authController.js`, `authService.js`, `tokenService.js`

Luồng hoạt động:

1. Người dùng nhập email và mật khẩu.
2. Frontend gọi API đăng nhập.
3. Backend kiểm tra thông tin đăng nhập.
4. Backend kiểm tra trạng thái tài khoản.
5. Backend tạo access token và refresh token.
6. Frontend lưu token, refresh token và thông tin user vào `localStorage`.
7. Frontend điều hướng người dùng đến màn hình phù hợp theo vai trò.

### 3.5 Luồng quên mật khẩu

File xử lý chính:

- Frontend: `ForgotPassword.jsx`, `ResetPassword.jsx`
- Backend: `authController.js`, `authService.js`, `otpService.js`

Luồng hoạt động:

1. Người dùng nhập email quên mật khẩu.
2. Backend kiểm tra email có tồn tại trong hệ thống.
3. Backend gửi OTP đặt lại mật khẩu.
4. Người dùng nhập OTP và mật khẩu mới.
5. Backend xác thực OTP.
6. Backend cập nhật mật khẩu mới.

## 4. Luồng Student

### 4.1 Khám phá khóa học

File xử lý chính:

- Frontend: `Courses.jsx`, `CourseDetail.jsx`
- Backend: `courseRoutes.js`, `courseController.js`, `courseService.js`

Luồng hoạt động:

1. Student truy cập danh sách khóa học.
2. Frontend gọi API lấy danh sách khóa học.
3. Student có thể tìm kiếm, lọc hoặc xem chi tiết khóa học.
4. Frontend hiển thị thông tin khóa học, danh mục, giá và nội dung mô tả.

### 4.2 Thanh toán khóa học

File xử lý chính:

- Frontend: `Checkout.jsx`, `PaymentResult.jsx`
- Backend: `orderController.js`, `paymentController.js`, `orderService.js`, `paymentService.js`

Luồng hoạt động:

1. Student chọn khóa học cần mua.
2. Frontend hiển thị màn hình checkout.
3. Student có thể áp dụng coupon hoặc điểm thưởng nếu có.
4. Frontend gọi API xem trước thanh toán.
5. Khi xác nhận, Backend tạo đơn hàng.
6. Backend tạo URL thanh toán VNPay.
7. Student được chuyển sang cổng thanh toán.
8. Sau khi thanh toán, VNPay trả kết quả về Backend.
9. Backend xác minh kết quả và cập nhật trạng thái đơn hàng.
10. Nếu thanh toán thành công, hệ thống ghi nhận quyền học cho Student.

### 4.3 Ghi danh và học bài

File xử lý chính:

- Frontend: `Enrollments.jsx`, `StudentLearning.jsx`
- Backend: `enrollmentController.js`, `lessonController.js`, `enrollmentService.js`

Luồng hoạt động:

1. Student xem danh sách khóa học đã ghi danh.
2. Student chọn khóa học để bắt đầu học.
3. Frontend lấy danh sách chapter và lesson của lớp học.
4. Student xem nội dung bài học.
5. Khi hoàn thành bài học, Student bấm đánh dấu hoàn thành.
6. Backend tạo hoặc cập nhật tiến độ học tập.
7. Enrollment được cập nhật phần trăm tiến độ.

### 4.4 Làm quiz

File xử lý chính:

- Frontend: `QuizTake.jsx`
- Backend: `quizController.js`, `quizService.js`

Luồng hoạt động:

1. Student mở quiz trong lớp học.
2. Frontend gọi API lấy chi tiết quiz.
3. Backend trả về câu hỏi nhưng không trả đáp án đúng.
4. Student bắt đầu attempt.
5. Student chọn đáp án và nộp bài.
6. Backend chấm điểm tự động.
7. Kết quả được lưu vào hệ thống.

### 4.5 Nộp assignment

File xử lý chính:

- Frontend: `StudentLearning.jsx`, `services/assignment.js`
- Backend: `assignmentController.js`

Luồng hoạt động:

1. Student xem bài tập trong lớp học.
2. Student nộp nội dung hoặc file bài làm.
3. Backend lưu submission.
4. Teacher xem bài nộp và chấm điểm.
5. Student xem kết quả sau khi được chấm.

## 5. Luồng Teacher

### 5.1 Xem lớp được phân công

File xử lý chính:

- Frontend: `TeacherDashboard.jsx`
- Backend: `teacherRoutes.js`, `teacherController.js`

Luồng hoạt động:

1. Teacher đăng nhập.
2. Teacher vào dashboard giảng dạy.
3. Frontend gọi API lấy danh sách lớp được phân công.
4. Teacher chọn lớp để xem học viên và nội dung học tập.

### 5.2 Quản lý chapter và lesson

File xử lý chính:

- Frontend: `TeacherDashboard.jsx`
- Backend: `chapterController.js`, `lessonController.js`

Luồng hoạt động:

1. Teacher chọn lớp cần quản lý.
2. Teacher tạo hoặc cập nhật chapter.
3. Teacher tạo lesson trong chapter.
4. Teacher có thể upload tài liệu hoặc video bài học.
5. Teacher có thể sắp xếp lại thứ tự lesson.
6. Học viên trong lớp sẽ học theo nội dung đã được cập nhật.

### 5.3 Quản lý quiz và assignment

File xử lý chính:

- Frontend: `TeacherDashboard.jsx`
- Backend: `quizController.js`, `assignmentController.js`, `teacherController.js`

Luồng hoạt động:

1. Teacher tạo quiz hoặc assignment cho lớp.
2. Student làm quiz hoặc nộp assignment.
3. Teacher xem kết quả quiz.
4. Teacher xem danh sách submission.
5. Teacher chấm điểm assignment.
6. Teacher theo dõi phân tích kết quả học tập.

## 6. Luồng Manager và Admin

### 6.1 Manager

Manager là người theo dõi vận hành đào tạo.

Các chức năng chính:

- xem dashboard quản lý
- quản lý lớp học theo quyền
- theo dõi enrollment
- theo dõi đơn hàng và thanh toán
- xem báo cáo
- quản lý banner
- quản lý một số dữ liệu hệ thống theo permission

### 6.2 Admin

Admin là người quản trị toàn hệ thống.

Các chức năng chính:

- quản lý người dùng
- khóa hoặc mở khóa tài khoản
- quản lý vai trò
- quản lý permission
- quản lý khóa học
- quản lý danh mục
- quản lý lớp học
- quản lý banner
- quản lý setting hệ thống
- gửi và quản lý thông báo
- xem thống kê và báo cáo

## 7. Phân quyền trong hệ thống

Hệ thống sử dụng mô hình RBAC.

RBAC gồm:

- Role: vai trò của người dùng
- Permission: quyền cụ thể trong hệ thống
- User: người dùng được gán role

Các role chính:

- `STUDENT`
- `TEACHER`
- `MANAGER`
- `ADMIN`

Các permission được dùng để giới hạn quyền truy cập vào API. Ví dụ người dùng muốn quản lý khóa học cần có quyền liên quan đến course, người muốn quản lý quiz cần có quyền liên quan đến quiz.

Middleware `authenticateToken` kiểm tra người dùng đã đăng nhập hay chưa. Middleware `authorizeRoles` và `authorizePermissions` kiểm tra người dùng có đủ quyền để thực hiện hành động hay không.

## 8. Kết nối Frontend và Backend

Frontend không gọi trực tiếp database mà giao tiếp với Backend thông qua API.

Luồng kết nối:

1. Component trong `pages/` gọi hàm API trong `services/`.
2. File service sử dụng Axios instance trong `api.js`.
3. Axios tự gắn token vào header nếu người dùng đã đăng nhập.
4. Backend nhận request, xác thực token và kiểm tra quyền.
5. Controller gọi service để xử lý nghiệp vụ.
6. Service thao tác với model/repository.
7. Backend trả response JSON.
8. Frontend nhận response và cập nhật giao diện.

## 9. Thông báo thời gian thực

Dự án sử dụng Socket.IO để hỗ trợ thông báo realtime.

Luồng hoạt động:

1. Khi frontend kết nối socket, client gửi userId để join vào room riêng.
2. Backend lưu người dùng vào room theo user.
3. Khi có thông báo mới, backend phát sự kiện đến room tương ứng.
4. Frontend nhận sự kiện và cập nhật giao diện thông báo.

## 10. Upload file và tài liệu học tập

Hệ thống hỗ trợ upload ảnh khóa học, avatar và tài liệu bài học.

Luồng hoạt động:

1. Frontend gửi file bằng `multipart/form-data`.
2. Backend dùng middleware upload để nhận file.
3. Backend chuyển file thành dữ liệu phù hợp.
4. File được upload lên dịch vụ lưu trữ.
5. URL file được lưu vào database.
6. Frontend dùng URL này để hiển thị hoặc tải tài liệu.

## 11. Thanh toán

Dự án hỗ trợ thanh toán khóa học qua VNPay.

Luồng hoạt động:

1. Student chọn khóa học.
2. Student vào màn hình checkout.
3. Backend tạo đơn hàng.
4. Backend tạo đường dẫn thanh toán.
5. Student thanh toán trên cổng VNPay.
6. VNPay trả kết quả về Backend.
7. Backend xác minh chữ ký thanh toán.
8. Backend cập nhật trạng thái đơn hàng.
9. Nếu thành công, hệ thống cập nhật quyền học cho Student.

## 12. Chạy dự án

### Backend

```bash
cd Backend
npm install
npm run dev
```

Backend cần file `.env` để cấu hình port, database, token, email, upload và thanh toán.

Có thể tham khảo file:

```txt
Backend/.env.example
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend cần file `.env` để cấu hình địa chỉ API Backend.

Có thể tham khảo file:

```txt
Frontend/.env.example
```

## 13. Dữ liệu mẫu

Backend có script seed để tạo dữ liệu mẫu phục vụ kiểm thử.

```bash
cd Backend
npm run seed
```

Script seed tạo dữ liệu cơ bản như user, role, permission, category, course, class và enrollment. Khi dùng seed cần lưu ý dữ liệu cũ trong một số collection chính có thể bị xóa để tạo lại dữ liệu mới.

## 14. Tài liệu API

Backend có tích hợp Swagger UI để xem tài liệu API.

Sau khi chạy Backend, có thể truy cập:

```txt
/api/docs
```

Swagger giúp xem nhanh danh sách API, phương thức, request, response và nhóm chức năng.

## 15. Tóm tắt

Dự án ELMS hoạt động theo mô hình Client - Server. Frontend chịu trách nhiệm giao diện, điều hướng và gọi API. Backend chịu trách nhiệm xác thực, phân quyền, xử lý nghiệp vụ, lưu trữ dữ liệu, gửi OTP, upload file, thanh toán, thông báo và các tác vụ nền.

Nhờ cách chia theo route, controller, service, model và middleware, dự án có cấu trúc rõ ràng, dễ mở rộng và phù hợp với một hệ thống quản lý học tập trực tuyến nhiều vai trò.
