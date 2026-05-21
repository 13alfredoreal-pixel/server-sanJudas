import { Schema, model } from 'mongoose'

const scheduleEntrySchema = new Schema({
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'El curso es obligatorio']
    },
    dayOfWeek: {
        type: String,
        required: [true, 'El día es obligatorio'],
        enum: {
            values: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'],
            message: 'Día de la semana no válido'
        }
    },
    startTime: {
        type: String,
        required: [true, 'La hora de inicio es obligatoria'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)']
    },
    endTime: {
        type: String,
        required: [true, 'La hora de fin es obligatoria'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM)']
    },
    classroom: {
        type: String,
        trim: true,
        maxLength: [50, 'El aula no puede tener más de 50 caracteres'],
        default: ''
    }
}, { _id: true })

const scheduleSchema = new Schema({
    grade: {
        type: Schema.Types.ObjectId,
        ref: 'Grade',
        required: [true, 'El grado es obligatorio'],
        unique: true
    },
    entries: [scheduleEntrySchema],
    academicYear: {
        type: Number,
        default: () => new Date().getFullYear()
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
})

scheduleSchema.index({ grade: 1 })

export default model('Schedule', scheduleSchema)
