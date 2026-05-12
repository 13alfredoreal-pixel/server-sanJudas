import multer from "multer";

const MIMETYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const createMulterConfig = () => {
    return multer({
        storage: multer.memoryStorage(),
        fileFilter: (req, file, cb) => {
            if (MIMETYPES.includes(file.mimetype)) cb(null, true)
            else cb(new Error(`Tipo de archivo no permitido. Tipos válidos: ${MIMETYPES.join(', ')}`))
        },
        limits: {
            fileSize: MAX_FILE_SIZE
        }
    })
}

// Exportamos las instancias configuradas para cada caso de uso
export const uploadProfilePicture = createMulterConfig()
export const uploadPostImage = createMulterConfig()
