import User from '../users/user.model.js';
import Book from '../books/book.model.js';
import Review from '../reviews/review.model.js';
import AuditLog from '../audit/audit.model.js';

/**
 * getGeneralStats: Obtiene un resumen global del sistema.
 */
export const getGeneralStats = async (req, res) => {
    try {
        const [totalUsers, totalBooks, totalReviews, recentAuditLogs] = await Promise.all([
            User.countDocuments({ status: true }),
            Book.countDocuments(),
            Review.countDocuments(),
            AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('adminId', 'name surname email')
        ]);

        // Libros más populares (basado en cantidad de reseñas)
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

        // Usuarios más activos (ej. por favoritos o fecha de creación)
        const recentUsers = await User.find({ status: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name surname email createdAt profilePicture');

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalBooks,
                totalReviews
            },
            mostReviewedBooks,
            recentUsers,
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
