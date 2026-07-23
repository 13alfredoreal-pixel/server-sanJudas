import { Schema, model } from 'mongoose'

const bookSchema = new Schema({
    title: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        maxLength: [200, 'El título no puede tener más de 200 caracteres']
    },
    author: {
        type: String,
        required: [true, 'El autor es obligatorio'],
        trim: true,
        maxLength: [100, 'El autor no puede tener más de 100 caracteres']
    },
    category: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        default: 'Otros'
    },
    description: {
        type: String,
        maxLength: [500, 'La descripción no puede tener más de 500 caracteres'],
        default: ''
    },
    pdfUrl: {
        type: String,
        required: [true, 'El archivo PDF es obligatorio']
    },
    pdfPublicId: {
        type: String,
        required: true
    },
    coverUrl: {
        type: String,
        default: ''
    },
    coverPublicId: {
        type: String,
        default: ''
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
})

export default model('Book', bookSchema)
