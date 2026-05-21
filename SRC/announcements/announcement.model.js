import { Schema, model } from 'mongoose'

const announcementSchema = new Schema({
    title: {
        type: String,
        required: [true, 'El título del anuncio es obligatorio'],
        trim: true,
        maxLength: [200, 'El título no puede tener más de 200 caracteres']
    },
    content: {
        type: String,
        required: [true, 'El contenido del anuncio es obligatorio'],
        maxLength: [3000, 'El contenido no puede tener más de 3000 caracteres']
    },
    grade: {
        type: Schema.Types.ObjectId,
        ref: 'Grade',
        default: null
    },
    targetAudience: {
        type: String,
        enum: {
            values: ['TODOS', 'BASICO', 'BACHILLERATO', 'GRADO_ESPECIFICO'],
            message: 'Audiencia no válida'
        },
        default: 'TODOS'
    },
    type: {
        type: String,
        enum: {
            values: ['GENERAL', 'ACADEMICO', 'EVENTO', 'URGENTE', 'DEPORTIVO', 'CULTURAL'],
            message: 'Tipo de anuncio no válido'
        },
        default: 'GENERAL'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
})

announcementSchema.index({ targetAudience: 1, isActive: 1 })
announcementSchema.index({ createdAt: -1 })

export default model('Announcement', announcementSchema)
