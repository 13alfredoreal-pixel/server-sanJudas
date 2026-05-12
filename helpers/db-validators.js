import User from '../SRC/users/user.model.js'

export const emailExists = async (email = '') => {
    const existe = await User.findOne({ email })

    if (existe) {
        throw new Error('El email ya está registrado')
    }
}

