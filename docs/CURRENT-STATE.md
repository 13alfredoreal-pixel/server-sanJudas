# Current state — server-sanJudas

Inventario **as-is** tras BSJT-004/005/006. Actualizar cuando cambie la estructura real.

## Layout actual

```
index.js
configs/          app.js, db.js, cloudinary.js, supabase.js
src/              auth, users, books, categories, reviews, analytics, audit
middlewares/      JWT, admin, CORS, multer 2 (memory), validators, rate-limit, errors
helpers/          jwt, pdf-storage, validate-env, …
postman/          colección API
vercel.json
pnpm-lock.yaml
pnpm-workspace.yaml   # onlyBuiltDependencies: argon2
```

## Módulos API

| Prefijo           | Carpeta           |
| ----------------- | ----------------- |
| `/api/auth`       | `src/auth/`       |
| `/api/users`      | `src/users/`      |
| `/api/books`      | `src/books/`      |
| `/api/categories` | `src/categories/` |
| `/api/reviews`    | `src/reviews/`    |
| `/api/analytics`  | `src/analytics/`  |

Audit: `src/audit/` (logger, sin router).

## Eliminado en BSJT-003

- `/api/pdfs`, `/api/uploads` (estáticos locales)
- `uploads/`, migración local→Cloudinary, validators posts/comments
- `firebase-admin`, `express-mongo-sanitize`
- `package-lock.json` / npm — ahora **pnpm**

## Tooling (BSJT-005)

- ESLint + Prettier + Husky (lint-staged / commitlint)
- CI: `pnpm lint` + `pnpm format:check`

## Deuda consciente (no en este ticket)

- Deploy Vercel (pnpm/argon2) — aplazado
- Rotación de secretos históricos en git — aplazado
- Suite de tests automatizados — aplazado
- Alineación client + tooling client — BSJT-007 / BSJT-008 en `client-sanjudas`

## Invariantes

1. Prefijo `/api/*` y contrato en [API-CONTRACT.md](./API-CONTRACT.md).
2. Auth: JWT Bearer + refresh cookie HttpOnly + Argon2; secretos access/refresh distintos.
3. Roles: `USER_ROLE` | `ADMIN_ROLE`. Seed admin solo con `ADMIN_PASSWORD` en env.
4. Books: PDF en **Supabase** (`pdfPublicId`); covers/avatars en **Cloudinary**; dual-path HTTP legacy vía `pdfUrl`.
5. CORS allowlist con credentials.
6. **pnpm** + ESM + Multer 2.
7. Boot exige env críticos (`helpers/validate-env.js`).

Detalle PDF: [STORAGE-SUPABASE.md](./STORAGE-SUPABASE.md).
