import cloudinary from "../configs/cloudinary.js";
import { fileTypeFromBuffer } from 'file-type';

/**
 * Middleware para procesar la subida del buffer a Cloudinary.
 * Se ejecuta después de Multer.
 */
export const processFileUpload = async (req, res, next) => {
    // Si no hay archivo, simplemente pasamos al siguiente middleware
    if (!req.file) {
        return next();
    }

    try {
        // VALIDACIÓN DE SEGURIDAD: Magic Numbers
        const type = await fileTypeFromBuffer(req.file.buffer);
        if (!type || !type.mime.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: "Firma de archivo inválida: La imagen proporcionada no tiene un formato válido o es maliciosa."
            });
        }
        // Validación de configuración de Cloudinary
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            console.error("CRÍTICO: Cloudinary no está configurado en .env");
            return res.status(500).json({
                success: false,
                message: "Error interno: Configuración de almacenamiento incompleta"
            });
        }

        console.log(`[Cloudinary] Iniciando subida de: ${req.file.originalname} (${req.file.size} bytes)`);

        // Determinar carpeta destino según la ruta de la petición
        // AHORA: Solo permitimos subidas de perfiles/auth (según requerimiento de "solo fotos de usuarios")
        let folder = "";
        const url = req.originalUrl.toLowerCase();

        if (url.includes("/user") || url.includes("/auth")) {
            folder = "profiles";
        } else {
            console.log(`[Cloudinary] Salto de subida: La ruta ${url} no está autorizada para almacenamiento en nube.`);
            return next();
        }

        // Subida mediante stream (recomendado para memoryStorage)
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `SJT/${folder}`, // Organizamos bajo un prefijo del proyecto
                    resource_type: "image", // RESTRICCIÓN: Solo imágenes (bloquea PDFs)
                    transformation: [
                        { width: 1000, height: 1000, crop: "limit" } // Redimensionamos si es muy grande
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error("[Cloudinary Error]", error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            // Enviamos el buffer del archivo
            uploadStream.end(req.file.buffer);
        });

        console.log(`[Cloudinary] Subida exitosa: ${result.secure_url}`);

        // Guardamos la URL segura y el ID para que el controlador la use
        req.fileRelativePath = result.secure_url;
        req.filePublicId = result.public_id;

        console.log(`[Cloudinary] Capturado Public ID para DB: ${req.filePublicId}`);

        next();
    } catch (error) {
        console.error("[Fatal Error in processFileUpload]", error);
        return res.status(500).json({
            success: false,
            message: "La web no pudo procesar tu imagen en la nube",
            error: error.message
        });
    }
};
