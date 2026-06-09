import User from '../users/user.model.js'
import { hash, verify } from 'argon2'
import jwt from 'jsonwebtoken'
import { generarJWT, generarRefreshJWT } from "../../helpers/jwt-generate.js"
import cloudinary from '../../configs/cloudinary.js'

/**
 * REGISTRO DE USUARIO
 * 1. Recibe los datos del formulario (req.body).
 * 2. Procesa la imagen de perfil (usa una por defecto si no hay).
 * 3. Encripta la contraseña usando argon2 (por seguridad).
 * 4. Crea el nuevo usuario en la base de datos MongoDB.
 */
export const register = async (req, res) => {
  try {
    const data = req.body

    // Determinar la ruta de la foto de perfil
    let profilePicture = req.fileRelativePath || 'profiles/default-avatar.png'

    // Encriptación de la contraseña antes de guardarla
    const encryptedPassword = await hash(data.password)

    const newUser = await User.create({
      name: data.name,
      surname: data.surname,
      username: data.username.toLowerCase(),
      email: data.email.toLowerCase(),
      password: encryptedPassword,
      profilePicture,
      profilePicturePublicId: req.filePublicId || ''
    })

    // Generar tokens para auto-login tras el registro
    const token = await generarJWT(newUser.id, newUser.email);
    const refreshToken = await generarRefreshJWT(newUser.id);

    // Guardar refresh token en cookie seguraHttpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Retornamos éxito y el ID del usuario (el token está en la cookie)
    return res.status(200).json({
      message: "Usuario registrado correctamente",
      uid: newUser.id
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al registrar el usuario',
      err: error.message
    })
  }
}

/**
 * INICIO DE SESIÓN (LOGIN)
 * 1. Busca al usuario por email o nombre de usuario.
 * 2. Verifica que la contraseña coincida con la encriptada en la DB.
 * 3. Genera un Token JWT que permitirá al usuario navegar protegido.
 */
export const login = async (req, res) => {
  const { password, username, email } = req.body;
  const loginField = (username || email || "").trim().toLowerCase();

  try {
    console.log('--- LOGIN ATTEMPT ---', loginField);
    const user = await User.findOne({
      $or: [
        { email: loginField },
        { username: loginField }
      ],
    });

    if (!user) {
      return res.status(400).json({ message: "Credenciales incorrectas (Usuario no encontrado)" });
    }

    const validPassword = await verify(user.password, password);
    if (!validPassword) {
      return res.status(400).json({ message: "Credenciales incorrectas" });
    }

    const token = await generarJWT(user.id, user.email);
    const refreshToken = await generarRefreshJWT(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Retornamos éxito, el ID del usuario y el token (Máxima seguridad en Postman y Web)
    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      uid: user.id,
      token
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error del servidor",
      error: error.message,
    });
  }
};

/**
 * REFRESH TOKEN
 * Lee la cookie segura, verifica su validez y emite un nuevo AccessToken corto.
 */
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(400).json({ message: "No autenticado. Inicie sesión nuevamente." });
    }

    // Verificar el Refresh Token
    jwt.verify(token, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Sesión expirada o inválida. Inicie sesión nuevamente." });
      }

      // El token es válido, recuperar al usuario para asegurar que existe y sigue activo
      const user = await User.findById(decoded.uid);
      if (!user || user.status === false) {
        return res.status(403).json({ message: "Usuario no encontrado o inactivo." });
      }

      // Generar nuevo Access Token de corta duración
      const newAccessToken = await generarJWT(user.id, user.email);

      res.status(200).json({
        message: "Token actualizado",
        token: newAccessToken
      });
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error al renovar sesión",
      error: error.message,
    });
  }
};

/**
 * LOGOUT
 * Limpia la cookie del Refresh Token.
 */
export const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return res.status(200).json({ message: "Sesión cerrada correctamente" });
};