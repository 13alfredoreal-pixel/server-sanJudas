const REQUIRED = [
  'URI_MONGODB',
  'TOKEN_KEY',
  'REFRESH_TOKEN_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_PDF_BUCKET',
];

/**
 * Valida variables de entorno críticas antes de arrancar.
 * Lanza Error si falta alguna (falla el boot).
 */
export const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(', ')}. Copia .env.example → .env y completa los valores.`,
    );
  }

  if (process.env.TOKEN_KEY === process.env.REFRESH_TOKEN_KEY) {
    console.warn(
      '[env] TOKEN_KEY y REFRESH_TOKEN_KEY son iguales. Usa secretos distintos en producción.',
    );
  }

  if (!process.env.PORT?.trim()) {
    process.env.PORT = '3000';
  }
};
