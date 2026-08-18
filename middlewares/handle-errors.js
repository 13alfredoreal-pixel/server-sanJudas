export const handleErrors = (err, req, res, _next) => {
  console.error('[ERROR]', err.message || err);

  // Manejar errores de Multer (como archivo demasiado grande)
  if (err.code === 'LIMIT_FILE_SIZE' || err.name === 'MulterError') {
    return res.status(413).json({
      success: false,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'El archivo es demasiado grande. El límite de Multer es de 100MB; en Vercel el body no puede superar ~4.5 MB.'
          : err.message || 'Error al procesar el archivo',
    });
  }

  if (err.status === 400 && err.errors) {
    return res.status(400).json({
      errors: err.errors,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: err.message,
  });
};
