import { Schema, model } from 'mongoose'

const assignmentSchema = new Schema({
    title: {
        type: String,
        required: [true, 'El título de la tarea es obligatorio'],
        trim: true,
        maxLength: [200, 'El título no puede tener más de 200 caracteres']
    },
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        maxLength: [2000, 'La descripción no puede tener más de 2000 caracteres']
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'El curso es obligatorio']
    },
    grade: {
        type: Schema.Types.ObjectId,
        ref: 'Grade',
        required: [true, 'El grado es obligatorio']
    },
    dueDate: {
        type: Date,
        required: [true, 'La fecha de entrega es obligatoria']
    },
    points: {
        type: Number,
        min: [0, 'Los puntos no pueden ser negativos'],
        max: [100, 'Los puntos máximos son 100'],
        default: 10
    },
    type: {
        type: String,
        enum: {
            values: ['TAREA', 'EXAMEN', 'PROYECTO', 'LABORATORIO', 'INVESTIGACION', 'EXPOSICION'],
            message: 'Tipo de asignación no válido'
        },
        default: 'TAREA'
    },
    priority: {
        type: String,
        enum: ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'],
        default: 'MEDIA'
    },
    attachmentUrl: {
        type: String,
        default: ''
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

assignmentSchema.index({ grade: 1, course: 1 })
assignmentSchema.index({ dueDate: 1 })

export default model('Assignment', assignmentSchema)
