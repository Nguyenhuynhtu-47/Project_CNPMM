ROLE
Bạn là Senior Solution Architect, Business Analyst, System Analyst, Node.js Developer, React Developer và MongoDB Developer với hơn 15 năm kinh nghiệm.
Hãy phân tích, thiết kế và xây dựng hoàn chỉnh hệ thống:
TÊN ĐỀ TÀI
ENGLISH LEARNING MANAGEMENT SYSTEM (ELMS)
Hệ thống quản lý trung tâm tiếng Anh trực tuyến kết hợp LMS và đăng ký khóa học trực tuyến.
CÔNG NGHỆ BẮT BUỘC
Backend:
•	Node.js
•	Express.js
•	MongoDB
•	Mongoose
•	JWT Authentication
•	Redis
•	Socket.IO
•	Nodemailer
•	Cloudinary
•	VNPAY
Frontend:
•	ReactJS
•	Redux Toolkit
•	Redux Hooks
•	Axios
•	React Router DOM
•	TailwindCSS
•	SwiperJS
•	React Hook Form
•	Yup Validation
•	ChartJS hoặc Recharts
Kiến trúc:
•	3 Layer Architecture
o	Presentation Layer
o	Business Layer
o	Data Access Layer
Áp dụng:
•	Repository Pattern
•	Service Pattern
•	Middleware Pattern
•	DTO Pattern
•	RBAC
•	SOLID Principles
MỤC TIÊU HỆ THỐNG
Cho phép:
•	Học viên đăng ký và học trực tuyến
•	Admin quản lý khóa học
•	Admin mở lớp học
•	Admin phân công giảng viên
•	Giảng viên quản lý lớp được giao
•	Hệ thống tự động xếp lớp cho học viên
•	Theo dõi tiến độ học tập
•	Thi trực tuyến
•	Cấp chứng chỉ
•	Thanh toán trực tuyến
•	Thống kê và báo cáo
PHÂN QUYỀN
1.	Guest
2.	Student
3.	Teacher
4.	Manager
5.	Admin
CHỨC NĂNG XÁC THỰC
Register
•	Validation
•	Rate Limiting
•	OTP Email Verification
•	OTP hết hạn sau 5 phút
•	Hash Password bằng bcrypt
Login
•	JWT Access Token
•	Refresh Token
•	Rate Limiting
Forgot Password
•	OTP Email
•	Reset Password
Profile
•	Xem hồ sơ
•	Cập nhật hồ sơ
•	Đổi avatar
•	Đổi mật khẩu
NGHIỆP VỤ CHÍNH
Course (Khóa học)
Admin quản lý.
Ví dụ:
•	IELTS Foundation
•	IELTS 6.5+
•	IELTS 7.0+
•	TOEIC 500+
•	TOEIC 700+
•	English Communication
Thông tin:
•	Tên khóa học
•	Mô tả
•	Học phí
•	Hình ảnh
•	Video giới thiệu
•	Danh mục
•	Thời lượng
•	Số buổi học
•	Trạng thái
Class (Lớp học)
Mỗi khóa học có nhiều lớp.
Ví dụ:
IELTS Foundation ├── K01 ├── K02 ├── K03
Thông tin:
•	Mã lớp
•	Khóa học
•	Giảng viên phụ trách
•	Ngày bắt đầu
•	Ngày kết thúc
•	Sĩ số tối đa
•	Số học viên hiện tại
•	Trạng thái
Teacher Assignment
Admin tạo lớp và gán giảng viên.
Ví dụ:
IELTS Foundation K01 → Teacher A
IELTS Foundation K02 → Teacher B
Giảng viên được quản lý lớp được giao, không được chỉnh sửa học phí hoặc cấu hình khóa học.
QUẢN LÝ NỘI DUNG GIẢNG DẠY
Giảng viên được phép:
•	Upload video bài giảng
•	Upload PDF
•	Upload DOCX
•	Upload PPT
•	Upload Audio
•	Upload bài tập
•	Tạo Quiz
•	Tạo Assignment
•	Đăng thông báo lớp học
Cấu trúc:
Course ├── Chapter │ ├── Lesson │ ├── Lesson │ ├── Chapter │ ├── Lesson
Lesson gồm:
•	Tiêu đề
•	Nội dung
•	Video
•	Tài liệu
•	Thời lượng
QUIZ VÀ KIỂM TRA
Giảng viên tạo:
•	Quiz
•	Midterm Test
•	Final Test
Hỗ trợ:
•	Trắc nghiệm
•	Tự luận
Tính năng:
•	Chấm điểm tự động
•	Lưu lịch sử làm bài
•	Thống kê điểm
TRANG CHỦ
Hiển thị:
•	Banner
•	Danh mục khóa học
•	Khóa học nổi bật
•	Khóa học mới
•	Khóa học sắp khai giảng
•	Khóa học bán chạy
•	Đánh giá nổi bật
•	Tin tức
•	Thông báo
TÌM KIẾM VÀ LỌC
Theo:
•	Tên khóa học
•	Danh mục
•	Học phí
•	Trình độ
•	Giảng viên
Hỗ trợ:
•	Sorting
•	Pagination
•	Infinite Scroll
ĐĂNG KÝ KHÓA HỌC
Quy trình:
Student ↓ Đăng ký khóa học ↓ Thanh toán VNPAY ↓ Tự động xếp lớp ↓ Bắt đầu học
NGHIỆP VỤ TỰ ĐỘNG XẾP LỚP
Sau khi thanh toán thành công:
Hệ thống:
1.	Tìm các lớp thuộc khóa học.
2.	Loại bỏ lớp đã đầy.
3.	Ưu tiên lớp có ngày khai giảng gần nhất.
4.	Nếu lớp đã bắt đầu:
o	Chỉ cho tham gia nếu đã học dưới 20% chương trình.
5.	Nếu không có lớp phù hợp:
o	Đưa vào WAITING LIST.
Trạng thái:
•	WAITING_CLASS
•	ASSIGNED_CLASS
•	LEARNING
•	COMPLETED
•	CANCELLED
THANH TOÁN
Tích hợp:
•	VNPAY
Quy trình:
Đăng ký ↓ Tạo đơn hàng ↓ Thanh toán ↓ Xác nhận ↓ Xếp lớp
TIẾN ĐỘ HỌC TẬP
Theo dõi:
•	Bài học đã hoàn thành
•	Thời gian học
•	Điểm Quiz
•	Tỷ lệ hoàn thành
Ví dụ:
40 bài học
Hoàn thành: 28 bài
Tiến độ: 70%
ĐIỂM DANH
Điều kiện:
•	Tham gia lớp học trực tuyến hoặc
•	Xem trên 80% thời lượng video
CHỨNG CHỈ
Điều kiện:
•	Hoàn thành 100% bài học
•	Điểm cuối khóa >= 70
Hệ thống:
•	Sinh chứng chỉ PDF
•	QR Code xác thực
ĐÁNH GIÁ KHÓA HỌC
Chỉ học viên đã đăng ký mới được đánh giá.
Bao gồm:
•	Rating 1-5 sao
•	Nội dung đánh giá
•	Hình ảnh
Phần thưởng:
•	Coupon hoặc
•	Reward Point
THẢO LUẬN
Mỗi lớp học có diễn đàn riêng.
Học viên:
•	Đăng câu hỏi
•	Bình luận
Giảng viên:
•	Trả lời
•	Ghim bài viết
YÊU THÍCH
•	Thêm khóa học yêu thích
•	Xóa yêu thích
THÔNG BÁO REALTIME
Socket.IO
Thông báo:
•	Đăng ký mới
•	Thanh toán thành công
•	Xếp lớp thành công
•	Bài học mới
•	Quiz mới
•	Bình luận mới
Gửi:
•	Notification realtime
•	Email
DASHBOARD STUDENT
•	Khóa học đang học
•	Tiến độ học tập
•	Điểm kiểm tra
•	Chứng chỉ
•	Thông báo
DASHBOARD TEACHER
•	Lớp đang phụ trách
•	Học viên
•	Quiz
•	Assignment
•	Thống kê lớp học
DASHBOARD MANAGER
•	Quản lý học viên
•	Quản lý giảng viên
•	Quản lý lớp học
•	Quản lý đăng ký
•	Quản lý thanh toán
•	Báo cáo
DASHBOARD ADMIN
Toàn quyền:
•	User
•	Role
•	Permission
•	Course
•	Class
•	Payment
•	Banner
•	Notification
•	System Settings
THỐNG KÊ
Theo khoảng thời gian:
•	Doanh thu
•	Học viên mới
•	Số lượt đăng ký
•	Số lớp học
•	Tỷ lệ hoàn thành khóa học
•	Top 10 khóa học bán chạy
•	Top 10 giảng viên
Hiển thị:
•	Bảng
•	Biểu đồ
DATABASE COLLECTIONS
users roles permissions
categories courses
classes classSchedules
chapters lessons materials
enrollments lessonProgress
quizzes questions quizResults
assignments submissions
orders payments
certificates
reviews comments
wishlists
notifications
banners settings
YÊU CẦU ĐẦU RA
Hãy tạo:
1.	Business Requirement Specification
2.	Software Requirement Specification
3.	Use Case Diagram
4.	Activity Diagram
5.	Sequence Diagram
6.	ERD Database
7.	Class Diagram
8.	MongoDB Schema Design
9.	REST API Design
10.	Swagger Documentation
11.	Backend Folder Structure
12.	Frontend Folder Structure
13.	Redux Architecture
14.	Backend Source Code
15.	Frontend Source Code
16.	Deployment Guide
Yêu cầu:
•	Production-ready code
•	Clean Architecture
•	SOLID Principles
•	Security Best Practices
•	Không viết code demo
•	Không viết code giả lập
•	Sinh đầy đủ từng file và giải thích chi tiết
•	Nếu quá dài hãy chia thành nhiều phần và tiếp tục cho đến khi hoàn thành toàn bộ hệ thống.
