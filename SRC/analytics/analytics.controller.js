import User from '../users/user.model.js';
import Book from '../books/book.model.js';
import Review from '../reviews/review.model.js';
import AuditLog from '../audit/audit.model.js';
import Grade from '../grades/grade.model.js';
import Course from '../courses/course.model.js';
import Assignment from '../assignments/assignment.model.js';
import Announcement from '../announcements/announcement.model.js';

/**
 * getGeneralStats: Obtiene un resumen global del sistema incluyendo datos académicos.
 */
export const getGeneralStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalBooks,
            totalReviews,
            totalGrades,
            totalCourses,
            totalAssignments,
            totalAnnouncements,
            recentAuditLogs
        ] = await Promise.all([
            User.countDocuments({ status: true }),
            Book.countDocuments(),
            Review.countDocuments(),
            Grade.countDocuments({ isActive: true }),
            Course.countDocuments({ isActive: true }),
            Assignment.countDocuments({ isActive: true }),
            Announcement.countDocuments({ isActive: true }),
            AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('adminId', 'name surname email')
        ]);

        const mostReviewedBooks = await Review.aggregate([
            { $group: { _id: "$book", reviewCount: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
            { $sort: { reviewCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "books",
                    localField: "_id",
                    foreignField: "_id",
                    as: "bookDetails"
                }
            },
            { $unwind: "$bookDetails" }
        ]);

        const recentUsers = await User.find({ status: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name surname email createdAt profilePicture grade')
            .populate('grade', 'name level');

        const studentsPerGrade = await User.aggregate([
            { $match: { status: true, grade: { $ne: null } } },
            { $group: { _id: "$grade", totalStudents: { $sum: 1 } } },
            {
                $lookup: {
                    from: "grades",
                    localField: "_id",
                    foreignField: "_id",
                    as: "gradeDetails"
                }
            },
            { $unwind: "$gradeDetails" },
            { $sort: { "gradeDetails.yearNumber": 1 } }
        ]);

        const booksPerLevel = await Book.aggregate([
            { $group: { _id: "$level", totalBooks: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const upcomingAssignments = await Assignment.find({
            isActive: true,
            dueDate: { $gte: new Date() }
        })
            .populate('course', 'name')
            .populate('grade', 'name level')
            .sort({ dueDate: 1 })
            .limit(10);

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalBooks,
                totalReviews,
                totalGrades,
                totalCourses,
                totalAssignments,
                totalAnnouncements
            },
            mostReviewedBooks,
            recentUsers,
            studentsPerGrade,
            booksPerLevel,
            upcomingAssignments,
            recentAuditLogs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

/**
 * getAcademicStats: Estadísticas detalladas por nivel educativo.
 */
export const getAcademicStats = async (req, res) => {
    try {
        const { level } = req.params;
        const normalizedLevel = level.toUpperCase();

        if (!['BASICO', 'BACHILLERATO'].includes(normalizedLevel)) {
            return res.status(400).json({
                success: false,
                message: 'El nivel debe ser BASICO o BACHILLERATO'
            });
        }

        const grades = await Grade.find({ level: normalizedLevel, isActive: true })
            .sort({ yearNumber: 1 });

        const gradeIds = grades.map(g => g._id);

        const [coursesCount, assignmentsCount, studentsCount, booksCount] = await Promise.all([
            Course.countDocuments({ grade: { $in: gradeIds }, isActive: true }),
            Assignment.countDocuments({ grade: { $in: gradeIds }, isActive: true }),
            User.countDocuments({ grade: { $in: gradeIds }, status: true }),
            Book.countDocuments({ level: normalizedLevel })
        ]);

        const coursesPerGrade = await Course.aggregate([
            { $match: { grade: { $in: gradeIds }, isActive: true } },
            { $group: { _id: "$grade", totalCourses: { $sum: 1 } } },
            {
                $lookup: {
                    from: "grades",
                    localField: "_id",
                    foreignField: "_id",
                    as: "gradeDetails"
                }
            },
            { $unwind: "$gradeDetails" },
            { $sort: { "gradeDetails.yearNumber": 1 } }
        ]);

        return res.status(200).json({
            success: true,
            level: normalizedLevel,
            stats: {
                totalGrades: grades.length,
                totalCourses: coursesCount,
                totalAssignments: assignmentsCount,
                totalStudents: studentsCount,
                totalBooks: booksCount
            },
            grades,
            coursesPerGrade
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas académicas',
            error: error.message
        });
    }
};
