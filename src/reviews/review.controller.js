import Review from './review.model.js'

export const addReview = async (req, res) => {
    try {
        const { bookId, rating, comment } = req.body
        const userId = req.uid

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({ user: userId, book: bookId })
        if (existingReview) {
            return res.status(400).send({
                success: false,
                message: 'Ya has calificado este libro'
            })
        }

        const review = new Review({
            user: userId,
            book: bookId,
            rating,
            comment
        })

        await review.save()

        return res.send({
            success: true,
            message: 'Reseña agregada correctamente',
            review
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send({
            success: false,
            message: 'Error al agregar la reseña',
            error: error.message
        })
    }
}

export const getReviewsByBook = async (req, res) => {
    try {
        const { bookId } = req.params
        const reviews = await Review.find({ book: bookId })
            .populate('user', 'username name surname profilePicture')
            .sort({ createdAt: -1 })

        // Calculate average rating
        const totalRating = reviews.reduce((acc, current) => acc + current.rating, 0)
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0

        return res.send({
            success: true,
            reviews,
            averageRating: Number(averageRating),
            totalReviews: reviews.length
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send({
            success: false,
            message: 'Error al obtener las reseñas',
            error: error.message
        })
    }
}

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.uid
        const role = req.user.role

        const review = await Review.findById(id)
        if (!review) {
            return res.status(404).send({
                success: false,
                message: 'Reseña no encontrada'
            })
        }

        // Only owner or admin can delete
        if (review.user.toString() !== userId && role !== 'ADMIN_ROLE') {
            return res.status(403).send({
                success: false,
                message: 'No tienes permiso para eliminar esta reseña'
            })
        }

        await Review.findByIdAndDelete(id)

        return res.send({
            success: true,
            message: 'Reseña eliminada correctamente'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send({
            success: false,
            message: 'Error al eliminar la reseña',
            error: error.message
        })
    }
}
