export const handleErrors = (err, req, res, next) => {
    console.error('[ERROR]', err.message || err);

    // Manejar errores de Multer (como archivo demasiado grande)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: "El archivo es demasiado grande. El límite es de 100MB."
        });
    }

    if (err.status === 400 && err.errors) {
        return res.status(400).json({
            errors: err.errors
        });
    }

    return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: err.message
    });
};
