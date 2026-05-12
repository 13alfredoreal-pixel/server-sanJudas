import { Schema, model } from 'mongoose'

const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio']
    },
    book: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'El libro es obligatorio']
    },
    rating: {
        type: Number,
        required: [true, 'La calificación es obligatoria'],
        min: [1, 'La calificación mínima es 1'],
        max: [5, 'La calificación máxima es 5']
    },
    comment: {
        type: String,
        maxLength: [500, 'El comentario no puede tener más de 500 caracteres'],
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
})

export default model('Review', reviewSchema)
