const cron = require("node-cron");
const Enrollment = require("../models/Enrollment");
const { getIo } = require("../utils/socket");

cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();

        const expiredEnrollments = await Enrollment.find({
            status: "PENDING",
            expiresAt: { $lte: now }
        });

        if (!expiredEnrollments.length) return;

        await Enrollment.updateMany(
            {
                status: "PENDING",
                expiresAt: { $lte: now }
            },
            {
                status: "CANCELLED"
            }
        );

        let io;
        try {
            io = getIo();
        } catch (err) {
            console.log("Socket not initialized yet");
            return;
        }

        expiredEnrollments.forEach((enroll) => {
            if (!enroll.userId) return;

            const payload = {
                title: "Enrollment cancelled",
                message: "Your course reservation expired after 30 minutes",
                courseId: enroll.courseId,
                enrollmentId: enroll._id,
                createdAt: new Date(),
                read: false
            };

            // realtime notification
            io.to(`user:${enroll.userId}`).emit("enrollment-cancelled", payload);

            io.to(`user:${enroll.userId}`).emit("new-notification", payload);
        });

        if (expiredEnrollments.length > 0) {
            console.log(`[CRON] Cancelled & notified: ${expiredEnrollments.length}`);
        }

    } catch (err) {
        console.error("[CRON ERROR]", err);
    }
});