import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 100,
    message: {
        success: false,
        message: "Demasiados intentos de inicio de sesión, por favor inténtalo de nuevo después de 15 minutos"
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
});
