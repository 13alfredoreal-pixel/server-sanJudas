import { Schema, model } from 'mongoose'

const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        unique: true
    },
    icon: {
        type: String,
        default: '📄'
    }
}, {
    timestamps: true,
    versionKey: false
})

export default model('Category', categorySchema)
