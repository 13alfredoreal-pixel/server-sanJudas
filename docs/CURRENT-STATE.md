# Current state — server-sanJudas

Inventario **as-is** para refactor. Actualizar cuando cambie la estructura real.

## Layout actual

```
index.js
configs/          app.js, db.js, cloudinary.js
SRC/              auth, users, books, categories, reviews, analytics, audit
middlewares/      JWT, admin, CORS, multer, validators, rate-limit, errors
helpers/
scripts/
uploads/          PDFs locales (legacy)
assets/img/       estáticos
vercel.json
```

Nota: el dominio vive en `SRC/` (mayúsculas), no `src/`.

## Módulos API montados

| Prefijo | Carpeta |
|---------|---------|
| `/api/auth` | `SRC/auth/` |
| `/api/users` | `SRC/users/` |
| `/api/books` | `SRC/books/` |
| `/api/categories` | `SRC/categories/` |
| `/api/reviews` | `SRC/reviews/` |
| `/api/analytics` | `SRC/analytics/` |
| `/api/pdfs`, `/api/uploads` | estáticos en `configs/app.js` |

Audit: `SRC/audit/` (logger, sin router).

## Deuda / leftovers conocidos

| Ítem | Notas |
|------|-------|
| `middlewares/post-validator.js`, `comment-validator.js` | Legado “posts”; no hay dominio posts activo |
| `uploads/` + `/api/pdfs` | Legacy local; PDFs productivos en Cloudinary |
| `mongoSanitize` comentado | Incompatibilidad Express 5 (`req.query` read-only) |
| Sin suite de tests | `npm test` es placeholder |
| `.env` | Debe permanecer fuera de git (ver `.gitignore`) |
| Seed admin | `SRC/users/user.seed.js` — `admin@sanjudas.edu.gt` |

## Invariantes a preservar en un refactor

1. Prefijo `/api/*` y shapes documentados en [API-CONTRACT.md](./API-CONTRACT.md) (o actualizar contrato + client en el mismo cambio).
2. Auth: JWT Bearer + refresh cookie HttpOnly + Argon2.
3. Roles: `USER_ROLE` | `ADMIN_ROLE`.
4. Books: `pdfUrl`/`pdfPublicId` (+ cover opcional) en Cloudinary.
5. CORS allowlist con credentials para el origin del SPA.
6. npm; ESM (`"type": "module"`).

## Qué puede cambiar libremente (con PR BSJT)

- Nombres de carpetas (`SRC` → `src`), reorganización de middlewares/helpers.
- Extracción de servicios, validadores, capas.
- Eliminación de leftovers posts/comments/uploads legacy (si se valida no uso).
- Mejoras de errores, logging, tests, CI.

Tras mover rutas o archivos públicos del contrato, actualizar `AGENTS.md`, rules/skills y este documento.
