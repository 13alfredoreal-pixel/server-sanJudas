import User from './user.model.js';
import { hash } from 'argon2';

/**
 * setupAdmin: 
 * Verifica si existe un administrador en la base de datos.
 * Si no existe, crea uno por defecto.
 */
export const setupAdmin = async () => {
    try {
        // Buscamos si ya existe algún usuario con el rol ADMIN_ROLE
        const adminExists = await User.findOne({ role: 'ADMIN_ROLE' });

        if (adminExists) {
            console.log('SEEDER | El administrador ya existe');
            return;
        }

        // Datos del administrador por defecto
        const defaultAdmin = {
            name: 'Administrador',
            surname: 'Principal',
            username: 'admin',
            email: 'admin@sanjudas.edu.gt',
            password: 'Admin123!', // Contraseña segura inicial
            role: 'ADMIN_ROLE'
        };

        // Encriptamos la contraseña
        const hashedPassword = await hash(defaultAdmin.password);
        
        // Creamos el usuario
        await User.create({
            ...defaultAdmin,
            password: hashedPassword
        });

        console.log('********************************************************');
        console.log('*   SEEDER: Administrador creado exitosamente          *');
        console.log('*   Usuario: admin                                     *');
        console.log('*   Password: Admin123!                                *');
        console.log('********************************************************');

    } catch (error) {
        console.error('!!! SEEDER: Error al crear el administrador inicial:', error.message);
    }
};
