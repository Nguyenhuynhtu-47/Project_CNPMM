require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Course = require("../models/Course");
const Category = require("../models/Category");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const rbacService = require("../service/rbacService");

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected");

        // Xóa dữ liệu cũ
        await User.deleteMany({});
        await Course.deleteMany({});
        await Category.deleteMany({});
        await Class.deleteMany({});
        await Enrollment.deleteMany({});
        await Role.deleteMany({});
        await Permission.deleteMany({});

        // ==========================
        // CATEGORY
        // ==========================
        const categories = await Category.insertMany([
            {
                name: "IELTS",
                description: "IELTS Preparation Courses"
            },
            {
                name: "TOEIC",
                description: "TOEIC Preparation Courses"
            },
            {
                name: "Communication",
                description: "English Communication"
            },
            {
                name: "Business English",
                description: "Business English Courses"
            },
            {
                name: "Grammar",
                description: "English Grammar"
            },
            {
                name: "Pronunciation",
                description: "English Pronunciation"
            }
        ]);

        const map = {};
        categories.forEach(c => map[c.name] = c);

        // ==========================
        // USER
        // ==========================

        const password = await bcrypt.hash("123456", 10);

        const users = [
            {
                email: "admin@elms.com",
                password,
                role: "ADMIN",
                status: "ACTIVE",
                fullName: "System Administrator"
            },
            {
                email: "manager@elms.com",
                password,
                role: "MANAGER",
                status: "ACTIVE",
                fullName: "Training Manager"
            },
            {
                email: "teacher1@elms.com",
                password,
                role: "TEACHER",
                status: "ACTIVE",
                fullName: "Nguyễn Văn An"
            },
            {
                email: "teacher2@elms.com",
                password,
                role: "TEACHER",
                status: "ACTIVE",
                fullName: "Trần Minh Quân"
            },
            {
                email: "teacher3@elms.com",
                password,
                role: "TEACHER",
                status: "ACTIVE",
                fullName: "Lê Thu Hà"
            }
        ];

        for (let i = 1; i <= 20; i++) {
            users.push({
                email: `student${String(i).padStart(2, "0")}@elms.com`,
                password,
                role: "STUDENT",
                status: "ACTIVE",
                fullName: `Student ${i}`,
                phone: `090123${String(i).padStart(4, "0")}`,
                address: "Vietnam"
            });
        }

        const insertedUsers = await User.insertMany(users);
        await rbacService.seedDefaultRbac();
        await Promise.all(insertedUsers.map((user) => rbacService.assignRoleToUser(user._id, user.role)));

        // ==========================
        // COURSE
        // ==========================

        const courses = [
            {
                title: "IELTS Foundation",
                description: "Khóa học IELTS dành cho người mới bắt đầu.",
                price: 1200000,
                category: map["IELTS"]._id,
                durationWeeks: 8,
                sessionCount: 24,
                imageUrl: "https://picsum.photos/600/400?1"
            },
            {
                title: "IELTS 5.5",
                description: "Khóa học luyện thi IELTS mục tiêu 5.5.",
                price: 1800000,
                category: map["IELTS"]._id,
                durationWeeks: 10,
                sessionCount: 30,
                imageUrl: "https://picsum.photos/600/400?2"
            },
            {
                title: "IELTS 6.5+",
                description: "Khóa học luyện thi IELTS nâng cao.",
                price: 2500000,
                category: map["IELTS"]._id,
                durationWeeks: 12,
                sessionCount: 36,
                imageUrl: "https://picsum.photos/600/400?3"
            },
            {
                title: "TOEIC 450",
                description: "Khóa học TOEIC cơ bản.",
                price: 900000,
                category: map["TOEIC"]._id,
                durationWeeks: 8,
                sessionCount: 20,
                imageUrl: "https://picsum.photos/600/400?4"
            },
            {
                title: "TOEIC 650",
                description: "Khóa học TOEIC nâng cao.",
                price: 1500000,
                category: map["TOEIC"]._id,
                durationWeeks: 10,
                sessionCount: 28,
                imageUrl: "https://picsum.photos/600/400?5"
            },
            {
                title: "Business English",
                description: "Tiếng Anh trong doanh nghiệp.",
                price: 1700000,
                category: map["Business English"]._id,
                durationWeeks: 8,
                sessionCount: 24,
                imageUrl: "https://picsum.photos/600/400?6"
            },
            {
                title: "English Communication",
                description: "Tiếng Anh giao tiếp hằng ngày.",
                price: 800000,
                category: map["Communication"]._id,
                durationWeeks: 6,
                sessionCount: 18,
                imageUrl: "https://picsum.photos/600/400?7"
            },
            {
                title: "English Grammar",
                description: "Ngữ pháp tiếng Anh từ cơ bản đến nâng cao.",
                price: 700000,
                category: map["Grammar"]._id,
                durationWeeks: 6,
                sessionCount: 18,
                imageUrl: "https://picsum.photos/600/400?8"
            },
            {
                title: "English Pronunciation",
                description: "Luyện phát âm chuẩn Anh - Mỹ.",
                price: 1000000,
                category: map["Pronunciation"]._id,
                durationWeeks: 6,
                sessionCount: 16,
                imageUrl: "https://picsum.photos/600/400?9"
            },
            {
                title: "Travel English",
                description: "Tiếng Anh dành cho du lịch.",
                price: 600000,
                category: map["Communication"]._id,
                durationWeeks: 4,
                sessionCount: 12,
                imageUrl: "https://picsum.photos/600/400?10"
            }
        ];

        const insertedCourses = await Course.insertMany(courses);

        // ==========================
        // CLASS + ENROLLMENT
        // ==========================

        const teachers = await User.find({ role: "TEACHER" }).sort({ email: 1 });
        const students = await User.find({ role: "STUDENT" }).sort({ email: 1 });
        const now = new Date();
        const addWeeks = (weeks) => new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);

        const classes = await Class.insertMany(insertedCourses.slice(0, 6).map((course, index) => ({
            code: `ELMS-${String(index + 1).padStart(3, "0")}`,
            course: course._id,
            teacher: teachers[index % teachers.length]._id,
            startDate: addWeeks(index % 2),
            endDate: addWeeks((index % 2) + Number(course.durationWeeks || 8)),
            maxStudents: 20,
            currentStudents: 0,
            status: index % 2 === 0 ? "OPEN" : "IN_PROGRESS"
        })));

        const enrollments = students.slice(0, 12).map((student, index) => {
            const classItem = classes[index % classes.length];
            return {
                user: student._id,
                course: classItem.course,
                class: classItem._id,
                status: index % 3 === 0 ? "LEARNING" : "ASSIGNED_CLASS",
                progress: index % 3 === 0 ? 35 : 0
            };
        });

        await Enrollment.insertMany(enrollments);
        await Promise.all(classes.map((classItem) => Class.findByIdAndUpdate(
            classItem._id,
            { currentStudents: enrollments.filter((enrollment) => String(enrollment.class) === String(classItem._id)).length }
        )));

        console.log("=================================");
        console.log("✅ Seed completed successfully!");
        console.log("=================================");
        console.log("Admin:");
        console.log("Email: admin@elms.com");
        console.log("Password: 123456");
        console.log("---------------------------------");
        console.log("Manager:");
        console.log("Email: manager@elms.com");
        console.log("Password: 123456");
        console.log("---------------------------------");
        console.log("Teachers:");
        console.log("teacher1@elms.com");
        console.log("teacher2@elms.com");
        console.log("teacher3@elms.com");
        console.log("Password: 123456");
        console.log("---------------------------------");
        console.log("Students:");
        console.log("student01@elms.com -> student20@elms.com");
        console.log("Password: 123456");

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
