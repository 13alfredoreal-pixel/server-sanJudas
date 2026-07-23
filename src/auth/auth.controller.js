import User from '../users/user.model.js';
import { hash, verify } from 'argon2';
import jwt from 'jsonwebtoken';
import { generarJWT, generarRefreshJWT } from '../../helpers/jwt-generate.js';

const REFRESH_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  try {
    const data = req.body;
    const profilePicture = req.fileRelativePath || '';
    const encryptedPassword = await hash(data.password);

    const newUser = await User.create({
      name: data.name,
      surname: data.surname,
      username: data.username.toLowerCase(),
      email: data.email.toLowerCase(),
      password: encryptedPassword,
      profilePicture,
      profilePicturePublicId: req.filePublicId || '',
    });

    const refreshToken = await generarRefreshJWT(newUser.id);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE);

    return res.status(200).json({
      message: 'Usuario registrado correctamente',
      uid: newUser.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al registrar el usuario',
      err: error.message,
    });
  }
};

export const login = async (req, res) => {
  const { password, username, email } = req.body;
  const loginField = (username || email || '').trim().toLowerCase();

  try {
    const user = await User.findOne({
      $or: [{ email: loginField }, { username: loginField }],
    });

    if (!user) {
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    const validPassword = await verify(user.password, password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    const token = await generarJWT(user.id, user.email);
    const refreshToken = await generarRefreshJWT(user.id);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE);

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      uid: user.id,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error del servidor',
      error: error.message,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(400).json({ message: 'No autenticado. Inicie sesión nuevamente.' });
    }

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY, (err, payload) => {
        if (err) reject(err);
        else resolve(payload);
      });
    });

    const user = await User.findById(decoded.uid);
    if (!user || user.status === false) {
      return res.status(403).json({ message: 'Usuario no encontrado o inactivo.' });
    }

    const newAccessToken = await generarJWT(user.id, user.email);
    return res.status(200).json({
      message: 'Token actualizado',
      token: newAccessToken,
    });
  } catch {
    return res
      .status(403)
      .json({ message: 'Sesión expirada o inválida. Inicie sesión nuevamente.' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.status(200).json({ message: 'Sesión cerrada correctamente' });
};
