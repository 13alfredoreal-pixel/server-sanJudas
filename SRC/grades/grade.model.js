import { Schema, model } from 'mongoose'

const gradeSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre del grado es obligatorio'],
        trim: true,
        unique: true,
        maxLength: [100, 'El nombre no puede tener más de 100 caracteres']
    },
    level: {
        type: String,
        required: [true, 'El nivel educativo es obligatorio'],
        enum: {
            values: ['BASICO', 'BACHILLERATO'],
            message: 'El nivel debe ser BASICO o BACHILLERATO'
        }
    },
    section: {
        type: String,
        trim: true,
        maxLength: [10, 'La sección no puede tener más de 10 caracteres'],
        default: 'A'
    },
    description: {
        type: String,
        maxLength: [500, 'La descripción no puede tener más de 500 caracteres'],
        default: ''
    },
    yearNumber: {
        type: Number,
        required: [true, 'El número de año es obligatorio'],
        min: [1, 'El año mínimo es 1'],
        max: [6, 'El año máximo es 6']
    },
    shift: {
        type: String,
        enum: ['MATUTINA', 'VESPERTINA', 'NOCTURNA'],
        default: 'MATUTINA'
    },
    maxStudents: {
        type: Number,
        default: 35,
        min: [1, 'Mínimo 1 estudiante'],
        max: [60, 'Máximo 60 estudiantes']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
})

gradeSchema.index({ level: 1, yearNumber: 1 })

export default model('Grade', gradeSchema)
