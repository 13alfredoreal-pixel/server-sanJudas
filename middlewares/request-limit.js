import rateLimit from "express-rate-limit";

const windowMs = 15 * 60 * 1000;
const max = 70;

export const publicLimiter = rateLimit({
    windowMs,
    max,
    message: { message: 'Demasiadas peticiones, intente de nuevo en 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
});

export const authenticatedLimiter = rateLimit({
    windowMs,
    max,
    message: { message: 'Has excedido el límite de peticiones permitido' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, keyGeneratorIpFallback: false },
    keyGenerator: (req) => req.uid ? `uid:${req.uid}` : req.ip
});