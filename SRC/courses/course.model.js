import { Schema, model } from 'mongoose'

const courseSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre del curso es obligatorio'],
        trim: true,
        maxLength: [150, 'El nombre no puede tener más de 150 caracteres']
    },
    code: {
        type: String,
        trim: true,
        maxLength: [20, 'El código no puede tener más de 20 caracteres'],
        uppercase: true
    },
    grade: {
        type: Schema.Types.ObjectId,
        ref: 'Grade',
        required: [true, 'El grado es obligatorio']
    },
    teacher: {
        type: String,
        trim: true,
        maxLength: [100, 'El nombre del catedrático no puede tener más de 100 caracteres'],
        default: 'Por asignar'
    },
    description: {
        type: String,
        maxLength: [1000, 'La descripción no puede tener más de 1000 caracteres'],
        default: ''
    },
    schedule: {
        type: String,
        maxLength: [200, 'El horario no puede tener más de 200 caracteres'],
        default: ''
    },
    credits: {
        type: Number,
        min: [1, 'Mínimo 1 crédito'],
        max: [10, 'Máximo 10 créditos'],
        default: 3
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
})

courseSchema.index({ grade: 1, name: 1 })

export default model('Course', courseSchema)
