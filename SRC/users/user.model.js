import { Schema, model } from 'mongoose'

/**
 * Modelo de Usuario:
 * Define la estructura de los usuarios en la base de datos (MongoDB).
 * Incluye validaciones para nombres, correos y contraseñas.
 */
const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'el nombre es obligatorio'],
        maxLength: [25, 'El nombre no puede tener mas de 25 caracteres'],
        trim: true
    },
    surname: {
        type: String,
        required: [true, 'el apellido es obligatorio'],
        maxLength: [25, 'El apellido no puede tener mas de 25 caracteres'],
        trim: true
    },
    username: {
        type: String,
        required: [true, 'el username es obligatorio'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'el email es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'El email no es valido']
    },
    password: {
        type: String,
        required: [true, 'la contraseña es obligatoria'],
        minLength: [8, 'la contraseña debe tener almenos 8 caracteres']
    },
    profilePicture: {
        type: String,
        default: ''
    },
    profilePicturePublicId: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        minLength: [8, 'el telefono debe tener minimo 8 caracteres'],
        maxLength: [15, 'el telefono no debe tener mas de 15 caracteres'],
        trim: true
    },
    role: {
        type: String,
        enum: ['ADMIN_ROLE', 'USER_ROLE', 'TEACHER_ROLE'],
        default: 'USER_ROLE'
    },
    grade: {
        type: Schema.Types.ObjectId,
        ref: 'Grade',
        default: null
    },
    status: {
        type: Boolean,
        default: true
    },
    bio: {
        type: String,
        maxLength: [150, 'La biografía no puede tener más de 150 caracteres'],
        default: ''
    },
    favorites: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Book'
        }
    ],
    readingProgress: [
        {
            book: { type: Schema.Types.ObjectId, ref: 'Book' },
            lastPage: { type: Number, default: 1 },
            updatedAt: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true,
    versionKey: false
})

/**
 * Configuración para que cuando el servidor devuelva un usuario como JSON:
 * 1. No envíe la contraseña por seguridad.
 * 2. Asegure que el campo 'uid' esté disponible.
 */
userSchema.methods.toJSON = function () {
    const { password, __v, ...user } = this.toObject();
    user.uid = user._id;
    return user;
}

export default model('User', userSchema)