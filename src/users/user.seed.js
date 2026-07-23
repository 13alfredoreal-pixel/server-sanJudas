import User from './user.model.js';
import { hash } from 'argon2';

/**
 * setupAdmin: crea un ADMIN_ROLE solo si no existe ninguno.
 * Requiere ADMIN_PASSWORD en .env (no hay password hardcodeado).
 */
export const setupAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'ADMIN_ROLE' });

    if (adminExists) {
      console.log('SEEDER | El administrador ya existe');
      return;
    }

    const password = process.env.ADMIN_PASSWORD?.trim();
    if (!password) {
      console.warn(
        'SEEDER | No hay ADMIN_ROLE y falta ADMIN_PASSWORD en .env — no se crea admin. Define ADMIN_PASSWORD y reinicia.',
      );
      return;
    }

    if (password.length < 8) {
      console.warn('SEEDER | ADMIN_PASSWORD debe tener al menos 8 caracteres — no se crea admin.');
      return;
    }

    const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
    const email = process.env.ADMIN_EMAIL?.trim() || 'admin@sanjudas.edu.gt';
    const name = process.env.ADMIN_NAME?.trim() || 'Administrador';
    const surname = process.env.ADMIN_SURNAME?.trim() || 'Principal';

    await User.create({
      name,
      surname,
      username,
      email,
      password: await hash(password),
      role: 'ADMIN_ROLE',
    });

    console.log('SEEDER | Administrador creado');
    console.log(`SEEDER | username=${username} email=${email}`);
    console.log('SEEDER | password = valor de ADMIN_PASSWORD (no se imprime)');
  } catch (error) {
    console.error('SEEDER | Error al crear el administrador inicial:', error.message);
  }
};
