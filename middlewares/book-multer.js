import multer from 'multer';

/**
 * Middleware para la gestión de archivos de libros.
 * Configura Multer para usar memoria (buffer) y valida los tipos de archivos.
 */
const storage = multer.memoryStorage();

export const uploadBookFiles = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 100 }, // 100MB para libros extensos
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'pdf' && file.mimetype !== 'application/pdf') {
            return cb(new Error('Solo se permiten archivos PDF'));
        }
        if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
            return cb(new Error('La portada debe ser una imagen'));
        }
        cb(null, true);
    }
});
