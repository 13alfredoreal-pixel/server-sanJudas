import AuditLog from './audit.model.js';

/**
 * Registra una acción administrativa en la base de datos de auditoría.
 * @param {string} adminId - El ID del usuario que realiza la acción.
 * @param {string} action - El tipo de acción (enum).
 * @param {string} details - Una descripción detallada o el título del recurso afectado.
 * @param {string} ipAddress - La dirección IP (puede obtenerse de req.ip).
 */
export const logAdminAction = async (adminId, action, details, ipAddress = '') => {
    try {
        await AuditLog.create({
            adminId,
            action,
            details,
            ipAddress
        });
    } catch (error) {
        console.error('[Audit Logger Error]', error);
        // No lanzamos el error para no interrumpir el flujo principal del request
    }
};
