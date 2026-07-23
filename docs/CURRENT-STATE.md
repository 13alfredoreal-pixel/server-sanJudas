# Current state — server-sanJudas

Inventario **as-is** tras BSJT-003. Actualizar cuando cambie la estructura real.

## Layout actual

```
index.js
configs/          app.js, db.js, cloudinary.js
src/              auth, users, books, categories, reviews, analytics, audit
middlewares/      JWT, admin, CORS, multer (memory), validators, rate-limit, errors
helpers/
vercel.json
pnpm-lock.yaml
pnpm-workspace.yaml   # onlyBuiltDependencies: argon2
```

## Módulos API

| Prefijo | Carpeta |
|---------|---------|
| `/api/auth` | `src/auth/` |
| `/api/users` | `src/users/` |
| `/api/books` | `src/books/` |
| `/api/categories` | `src/categories/` |
| `/api/reviews` | `src/reviews/` |
| `/api/analytics` | `src/analytics/` |

Audit: `src/audit/` (logger, sin router).

## Eliminado en BSJT-003

- `/api/pdfs`, `/api/uploads` (estáticos locales)
- `uploads/`, migración local→Cloudinary, validators posts/comments
- `firebase-admin`, `express-mongo-sanitize`
- `package-lock.json` / npm — ahora **pnpm**
- Carpeta `src/` → `src/`

## Invariantes

1. Prefijo `/api/*` y contrato en [API-CONTRACT.md](./API-CONTRACT.md).
2. Auth: JWT Bearer + refresh cookie HttpOnly + Argon2.
3. Roles: `USER_ROLE` | `ADMIN_ROLE`.
4. Books/avatars: Cloudinary only (Multer memory).
5. CORS allowlist con credentials.
6. **pnpm** + ESM.
