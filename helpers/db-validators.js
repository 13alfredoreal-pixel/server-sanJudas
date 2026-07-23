import User from '../src/users/user.model.js';

export const emailExists = async (email = '') => {
  const existe = await User.findOne({ email: email.toLowerCase() });

  if (existe) {
    throw new Error('El email ya está registrado');
  }
};

export const usernameExists = async (username = '') => {
  const existe = await User.findOne({ username: username.toLowerCase() });

  if (existe) {
    throw new Error('El nombre de usuario ya está registrado');
  }
};
