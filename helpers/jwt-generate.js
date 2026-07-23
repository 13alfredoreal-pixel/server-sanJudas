import jwt from 'jsonwebtoken';

const getAccessSecret = () => {
  const secret = process.env.TOKEN_KEY;
  if (!secret) throw new Error('TOKEN_KEY no está definido en .env');
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY;
  if (!secret) throw new Error('REFRESH_TOKEN_KEY (o TOKEN_KEY) no está definido en .env');
  return secret;
};

export const generarJWT = (uid = '', email = '') =>
  new Promise((resolve, reject) => {
    jwt.sign({ uid, email }, getAccessSecret(), { expiresIn: '15m' }, (err, token) => {
      if (err) {
        console.error(err);
        reject(`Error al generar token: ${err.message}`);
      } else {
        resolve(token);
      }
    });
  });

export const generarRefreshJWT = (uid = '') =>
  new Promise((resolve, reject) => {
    jwt.sign({ uid }, getRefreshSecret(), { expiresIn: '7d' }, (err, token) => {
      if (err) {
        console.error(err);
        reject('Error al generar refresh token');
      } else {
        resolve(token);
      }
    });
  });

export { getAccessSecret, getRefreshSecret };
