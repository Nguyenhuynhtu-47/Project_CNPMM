# Quy trinh test tay toan bo du an ELMS

File nay dung de test lai toan bo he thong theo tung role va tung nghiep vu. Khi test, hay tick vao cac o `[ ]`, ghi loi vao phan "Ket qua thuc te / Bug".

## 0. Thong tin chuan bi

### Moi truong

- [ ] Backend dang chay.
- [ ] Frontend dang chay.
- [ ] MongoDB dang chay.
- [ ] Redis dang chay hoac backend hien thi Redis fallback.
- [ ] Neu test upload anh/video/file: da cau hinh Cloudinary hoac storage tuong ung.
- [ ] Neu test email OTP: da cau hinh SMTP.
- [ ] Neu test thanh toan VNPAY: da cau hinh VNPAY sandbox.

### Tai khoan seed mac dinh

Mat khau chung: `123456`

- Admin: `admin@elms.com`
- Manager: `manager@elms.com`
- Teacher: `teacher1@elms.com`, `teacher2@elms.com`, `teacher3@elms.com`
- Student: `student01@elms.com` den `student20@elms.com`

### Smoke test truoc khi test tay

- [ ] Mo frontend, khong bi trang trang.
- [ ] Mo backend health endpoint: `/api/health`.
- [ ] Login thanh cong bang tai khoan admin.
- [ ] Logout thanh cong.
- [ ] Refresh trang khi da login van giu dung session.
- [ ] Khi token het han, refresh token hoat dong hoac user duoc logout an toan.

Ket qua thuc te / Bug:

-

## 1. Auth, OTP, profile

### 1.1 Dang ky tai khoan moi

- [ ] Mo trang Register.
- [ ] Nhap email hop le, mat khau, confirm password.
- [ ] Submit form.
- [ ] He thong bao da gui OTP.
- [ ] Kiem tra user moi duoc tao o trang thai chua active neu co truy cap DB/admin.

Expected:

- Email trung bi chan.
- Password/confirm password khong khop bi chan.
- Form hien validation ro rang.

Ket qua thuc te / Bug:

-

### 1.2 Xac thuc OTP

- [ ] Mo trang Verify OTP.
- [ ] Nhap email va OTP dung.
- [ ] Submit.
- [ ] Tai khoan duoc active.
- [ ] Login bang tai khoan moi thanh cong.

Negative test:

- [ ] OTP sai bi bao loi.
- [ ] OTP het han bi bao loi.
- [ ] Redis tat thi OTP van verify duoc bang MongoDB fallback.

Ket qua thuc te / Bug:

-

### 1.3 Dang nhap, dang xuat, quen mat khau

- [ ] Login dung email/password.
- [ ] Login sai password bi bao loi.
- [ ] Login tai khoan inactive bi chan.
- [ ] Logout xoa token va quay ve login.
- [ ] Forgot password gui OTP reset.
- [ ] Reset password bang OTP dung.
- [ ] Login bang mat khau moi.

Ket qua thuc te / Bug:

-

### 1.4 Profile

- [ ] Mo Profile.
- [ ] Cap nhat ho ten, thong tin ca nhan.
- [ ] Luu thanh cong.
- [ ] Refresh trang, thong tin van con.
- [ ] Validation hoat dong voi du lieu khong hop le.

Ket qua thuc te / Bug:

-

## 2. Role, menu va phan quyen

### 2.1 Menu theo role

Login lan luot tung role va kiem tra menu My Account chi hien chuc nang phu hop.

- [ ] Student thay: Home, Courses, Orders, Enrollments, My learning, Profile, Notifications.
- [ ] Teacher thay: Home, Teacher dashboard, Courses neu duoc phep, Profile, Notifications.
- [ ] Manager thay: Home, Manager dashboard, cac muc quan ly/report phu hop.
- [ ] Admin thay: Admin dashboard, Admin management, cac muc quan tri.
- [ ] User khong du quyen truy cap URL truc tiep bi redirect/chan.

Ket qua thuc te / Bug:

-

### 2.2 RBAC admin

- [ ] Admin mo Admin Management -> Roles.
- [ ] Xem danh sach permissions.
- [ ] Tao role moi.
- [ ] Gan permission cho role.
- [ ] Cap nhat role user.
- [ ] Login lai bang user do, kiem tra quyen thay doi dung.

Ket qua thuc te / Bug:

-

## 3. Admin Management

### 3.1 Quan ly user

- [ ] Mo tab Users.
- [ ] Danh sach co phan trang.
- [ ] Loc/search theo email/name/role/status.
- [ ] Doi role user.
- [ ] Toggle active/inactive.
- [ ] Reset password user.
- [ ] Tao staff account moi.
- [ ] Refresh trang, du lieu van dung.

Negative test:

- [ ] Email trung bi bao loi.
- [ ] Role khong hop le bi chan.

Ket qua thuc te / Bug:

-

### 3.2 Quan ly khoa hoc va category

- [ ] Mo tab Courses.
- [ ] Tao category moi.
- [ ] Tao course moi voi title, description, price, category, duration, session count.
- [ ] Upload anh khoa hoc.
- [ ] Course card hien anh dung.
- [ ] Sua course.
- [ ] Xoa course.
- [ ] Danh sach course co phan trang.

Negative test:

- [ ] Thieu title/price/category bi validation.
- [ ] File upload sai loai/qua lon bi chan.

Ket qua thuc te / Bug:

-

### 3.3 Quan ly lop hoc

- [ ] Mo tab Classes.
- [ ] Tao class cho mot course.
- [ ] Gan teacher.
- [ ] Nhap start/end date, max students, status.
- [ ] Sua class.
- [ ] Xem danh sach students cua class.
- [ ] Xoa class.
- [ ] Danh sach class va class students co phan trang.

Ket qua thuc te / Bug:

-

### 3.4 Banner va settings

- [ ] Tao banner voi title, image URL, link, position.
- [ ] Banner hien o home neu dang active.
- [ ] Xoa banner.
- [ ] Tao/update setting.
- [ ] Xoa setting.
- [ ] Danh sach co phan trang.

Ket qua thuc te / Bug:

-

### 3.5 Coupon, diem tich luy, payment management

- [ ] Mo tab Coupons.
- [ ] Tao coupon percent.
- [ ] Tao coupon fixed amount.
- [ ] Tao coupon co min order, usage limit, per-user limit, expiry date.
- [ ] Disable/Enable coupon.
- [ ] Coupon het han/disabled khong dung duoc khi checkout.
- [ ] Coupon dung thanh cong tru tien vao order.
- [ ] Coupon duoc dem used count sau khi order PAID.
- [ ] Mo tab Payments.
- [ ] Xem order/payment voi amount, status, method, created date.
- [ ] Danh sach coupon/payment co phan trang.

Ket qua thuc te / Bug:

-

### 3.6 Broadcast notification

- [ ] Mo tab Notifications.
- [ ] Gui notification cho tat ca user.
- [ ] Gui notification theo role.
- [ ] Gui notification theo status.
- [ ] User dang online nhan realtime tren trang Notifications.
- [ ] User refresh trang van thay notification tu DB.
- [ ] Mark read thanh cong.

Ket qua thuc te / Bug:

-

## 4. Manager Dashboard

- [ ] Login manager.
- [ ] Mo `/manager`.
- [ ] Xem thong ke students, teachers, classes, payments, enrollments.
- [ ] Doi date range filter.
- [ ] Bieu do/bang cap nhat theo filter.
- [ ] Cac danh sach co phan trang neu hien nhieu dong.
- [ ] Manager khong truy cap duoc trang admin-only.

Ket qua thuc te / Bug:

-

## 5. Teacher Dashboard

### 5.1 Lop duoc gan va danh sach hoc vien

- [ ] Login teacher.
- [ ] Mo `/teacher`.
- [ ] Chi thay lop cua teacher do.
- [ ] Mo danh sach students cua lop.
- [ ] Danh sach co phan trang.

Ket qua thuc te / Bug:

-

### 5.2 Chapter, lesson, material

- [ ] Tao chapter cho course/lop phu hop.
- [ ] Sua chapter.
- [ ] Xoa chapter.
- [ ] Tao lesson.
- [ ] Sua lesson.
- [ ] Reorder lessons.
- [ ] Upload material/video/pdf/audio.
- [ ] Xoa material.
- [ ] Student vao My learning thay lesson/material moi.

Ket qua thuc te / Bug:

-

### 5.3 Quiz

- [ ] Tao quiz voi title, duration/time limit, attempts.
- [ ] Tao cau hoi single/multiple choice/essay neu UI ho tro.
- [ ] Luu quiz thanh cong.
- [ ] Sua quiz.
- [ ] Student thay quiz trong course.
- [ ] Student start quiz.
- [ ] Student submit quiz.
- [ ] Diem duoc tinh dung.
- [ ] Attempts limit hoat dong.
- [ ] Time limit hoat dong.
- [ ] Teacher xem quiz results.
- [ ] Student nhan notification realtime "Quiz submitted".

Ket qua thuc te / Bug:

-

### 5.4 Assignment va cham diem

- [ ] Teacher tao assignment.
- [ ] Teacher sua assignment.
- [ ] Student thay assignment trong My learning.
- [ ] Student submit assignment.
- [ ] Teacher xem submissions.
- [ ] Teacher cham diem/feedback.
- [ ] Student thay diem/feedback sau khi cham.

Ket qua thuc te / Bug:

-

### 5.5 Attendance va discussion

- [ ] Teacher tao/cap nhat attendance cho class.
- [ ] Kiem tra attendance summary.
- [ ] Student xem attendance cua minh.
- [ ] Teacher xem class discussion.
- [ ] Student gui comment.
- [ ] Teacher update/delete/moderate comment neu UI/API ho tro.

Ket qua thuc te / Bug:

-

## 6. Student Course Discovery va Enrollment

### 6.1 Home va Courses

- [ ] Login student.
- [ ] Mo Home.
- [ ] Course moi hien dung anh, title, gia, rating neu co.
- [ ] Mo Courses.
- [ ] Search course.
- [ ] Filter theo category.
- [ ] Doi page size.
- [ ] Chuyen trang pagination.
- [ ] Mo Course Detail.
- [ ] Course Detail hien anh, description, price, category, duration, sessions, curriculum.

Ket qua thuc te / Bug:

-

### 6.2 Wishlist / yeu thich

- [ ] Them course vao wishlist.
- [ ] Course hien trong wishlist/my learning neu UI co hien.
- [ ] Remove wishlist.
- [ ] Refresh trang, wishlist dung.

Ket qua thuc te / Bug:

-

### 6.3 Course mien phi

- [ ] Chon course gia 0.
- [ ] Bam Enroll.
- [ ] Enrollment duoc tao.
- [ ] Course hien trong Enrollments/My learning.

Ket qua thuc te / Bug:

-

### 6.4 Course co phi va VNPAY

- [ ] Chon course co phi.
- [ ] Bam Checkout khong coupon/points.
- [ ] He thong tao order PENDING.
- [ ] Redirect sang VNPAY sandbox.
- [ ] Thanh toan thanh cong.
- [ ] Callback ve backend.
- [ ] Order status thanh PAID.
- [ ] Enrollment duoc tao/gan class neu co lop phu hop.
- [ ] Student thay course trong My learning.
- [ ] Student duoc cong diem tich luy theo amount.

Negative test:

- [ ] Thanh toan fail -> order FAILED.
- [ ] Payment callback lap lai khong tao duplicate payment/enrollment.

Ket qua thuc te / Bug:

-

### 6.5 Coupon khi checkout

- [ ] Nhap coupon hop le.
- [ ] Amount giam dung theo percent/fixed/cap.
- [ ] Coupon min order khong dat bi chan.
- [ ] Coupon disabled bi chan.
- [ ] Coupon expired bi chan.
- [ ] Coupon usage limit bi chan sau khi het luot.
- [ ] Per-user limit bi chan neu user dung qua so lan.

Ket qua thuc te / Bug:

-

### 6.6 Diem tich luy khi checkout

- [ ] Xem balance diem hien tai.
- [ ] Nhap so diem <= balance.
- [ ] Amount giam dung theo point value.
- [ ] Sau khi order PAID, diem da dung bi tru.
- [ ] Neu order FAILED/CANCELLED, diem duoc hoan.
- [ ] Neu coupon + points lam order con 0d, he thong tu PAID va khong redirect VNPAY.
- [ ] Student refresh lai thay balance moi.

Ket qua thuc te / Bug:

-

### 6.7 Auto cancel order sau 30 phut

- [ ] Tao order PENDING nhung khong thanh toan.
- [ ] Doi qua timeout cau hinh `ORDER_PAYMENT_TIMEOUT_MINUTES`.
- [ ] Cron huy order.
- [ ] Order status thanh CANCELLED.
- [ ] Diem da redeem duoc hoan.
- [ ] Student nhan notification realtime/order cancelled.

Goi y test nhanh: trong moi truong local co the tam dat timeout ngan hon trong `.env`, restart backend, roi tao order moi.

Ket qua thuc te / Bug:

-

## 7. Student Learning

### 7.1 My learning va lesson progress

- [ ] Mo My learning.
- [ ] Chi thay course da enroll/paid.
- [ ] Mo lesson.
- [ ] Video/pdf/audio hien dung.
- [ ] Mark lesson complete.
- [ ] Progress tang dung.
- [ ] Refresh trang progress van dung.
- [ ] Course progress trong Course Detail cap nhat.

Ket qua thuc te / Bug:

-

### 7.2 Review va diem thuong

- [ ] Student da enroll mo course detail/my learning.
- [ ] Tao review rating + comment.
- [ ] Review hien trong danh sach review cua course.
- [ ] User duoc cong diem review lan dau.
- [ ] Sua review khong duoc cong diem lan hai.

Ket qua thuc te / Bug:

-

### 7.3 Certificate

- [ ] Hoan thanh dieu kien course/certificate neu co.
- [ ] Issue certificate.
- [ ] Student xem danh sach certificate.
- [ ] Download PDF certificate.
- [ ] Verify certificate bang code/QR.
- [ ] Admin revoke certificate.
- [ ] Certificate revoked khong con hop le khi verify.

Ket qua thuc te / Bug:

-

## 8. Orders, Enrollments, Notifications

### 8.1 Orders page

- [ ] Student mo Orders.
- [ ] Thay order PENDING/PAID/FAILED/CANCELLED.
- [ ] Amount hien dung sau coupon/points.
- [ ] Coupon code, points discount neu UI co hien.
- [ ] Danh sach co phan trang.

Ket qua thuc te / Bug:

-

### 8.2 Enrollments page

- [ ] Student mo Enrollments.
- [ ] Thay course, class, status, progress.
- [ ] Danh sach co phan trang.
- [ ] Enrollment khong thuoc user khong hien.

Ket qua thuc te / Bug:

-

### 8.3 Notifications realtime

Mo 2 trinh duyet:

- Trinh duyet A: login Admin.
- Trinh duyet B: login Student va mo Notifications.

Test:

- [ ] Admin broadcast notification.
- [ ] Student nhan notification ngay, khong can refresh.
- [ ] Student mark read.
- [ ] Refresh trang, notification van read.
- [ ] Student submit quiz, nhan notification realtime.
- [ ] Order bi auto cancel, nhan notification realtime.
- [ ] Khong bi duplicate notification khi backend emit nhieu event tuong thich.

Ket qua thuc te / Bug:

-

## 9. Bao mat va validation

### 9.1 Protected route

- [ ] Chua login vao `/home` bi chuyen ve login.
- [ ] Student vao `/admin/manage` bi chan.
- [ ] Teacher vao `/manager` bi chan.
- [ ] Manager vao `/admin/manage` bi chan.
- [ ] Token invalid bi logout/bao loi.

Ket qua thuc te / Bug:

-

### 9.2 API validation

Dung Postman/Swagger hoac UI de test:

- [ ] ObjectId sai tra 400.
- [ ] Thieu field bat buoc tra 400.
- [ ] Khong co token tra 401.
- [ ] Khong du permission tra 403.
- [ ] Resource khong ton tai tra 404.
- [ ] Loi duplicate tra 409 neu co.

Ket qua thuc te / Bug:

-

### 9.3 Upload va file

- [ ] Upload file hop le thanh cong.
- [ ] File sai type bi chan.
- [ ] File qua lon bi chan.
- [ ] URL Cloudinary/storage luu dung.
- [ ] File hien dung tren frontend.

Ket qua thuc te / Bug:

-

## 10. Phan trang, loading, empty, error UI

Kiem tra tat ca trang hien danh sach:

- [ ] Courses.
- [ ] Users.
- [ ] Roles.
- [ ] Courses admin.
- [ ] Classes.
- [ ] Class students.
- [ ] Banners.
- [ ] Settings.
- [ ] Coupons.
- [ ] Notifications.
- [ ] Payments/Orders.
- [ ] Enrollments.
- [ ] My learning.
- [ ] Teacher classes/students.
- [ ] Quiz results.
- [ ] Assignments/submissions.

Voi moi trang:

- [ ] Co phan trang khi nhieu item.
- [ ] Doi page size neu UI co ho tro.
- [ ] Empty state de hieu.
- [ ] Loading state khong vo layout.
- [ ] Error state hien message de hieu.
- [ ] Mobile khong bi tran ngang bat thuong.

Ket qua thuc te / Bug:

-

## 11. Test hoi quy sau khi sua bug

Moi khi sua mot bug, chay lai cac case lien quan:

- [ ] Auth/login neu sua token, auth, role.
- [ ] Course list/detail neu sua course/category/image.
- [ ] Checkout neu sua order/payment/coupon/points.
- [ ] My learning neu sua enrollment/lesson/progress.
- [ ] Teacher dashboard neu sua quiz/assignment/attendance/comment.
- [ ] Notification realtime neu sua socket/notification/cron.
- [ ] Admin management neu sua user/role/course/class/settings/coupon.

Ket qua thuc te / Bug:

-

## 12. Checklist nghiem thu cuoi

- [ ] Tat ca role login duoc.
- [ ] Menu dung theo role.
- [ ] Course co anh va phan trang.
- [ ] Mua khoa hoc co phi thanh cong.
- [ ] Coupon hoat dong.
- [ ] Diem tich luy hoat dong.
- [ ] Don qua 30 phut khong thanh toan tu huy.
- [ ] My learning hien course da enroll.
- [ ] Lesson progress cap nhat.
- [ ] Quiz submit va cham diem dung.
- [ ] Assignment submit/cham diem dung.
- [ ] Attendance dung.
- [ ] Review va wishlist dung.
- [ ] Certificate issue/download/verify/revoke dung.
- [ ] Notification realtime dung.
- [ ] Admin CRUD dung.
- [ ] Manager report dung.
- [ ] Khong co loi console nghiem trong tren frontend.
- [ ] Khong co loi backend console khi test luong chinh.
- [ ] Frontend build pass.
- [ ] Backend syntax/check pass.

Tong ket ket qua test:

- So case pass:
- So bug:
- Bug nghiem trong:
- Bug can sua sau:
- Ket luan:
