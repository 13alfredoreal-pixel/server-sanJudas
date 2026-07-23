import multer from 'multer';

const MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const createMulterConfig = () =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (MIMETYPES.includes(file.mimetype)) cb(null, true);
      else cb(new Error(`Tipo de archivo no permitido. Tipos válidos: ${MIMETYPES.join(', ')}`));
    },
    limits: { fileSize: MAX_FILE_SIZE },
  });

export const uploadProfilePicture = createMulterConfig();
