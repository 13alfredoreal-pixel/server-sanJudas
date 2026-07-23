# Arquitectura — server-sanJudas

## Vista general

```
Client (Firebase Hosting / Vite local)
    │  HTTPS + cookies
    ▼
Express (Vercel / local)  ──►  MongoDB
    │
    ├──► Supabase Storage (PDFs)
    └──► Cloudinary (covers + avatars)
```

## Capas

| Capa          | Responsabilidad                          | Ubicación                                       |
| ------------- | ---------------------------------------- | ----------------------------------------------- |
| Bootstrap     | dotenv, `validateEnv`, DNS Atlas, listen | `index.js`, `helpers/validate-env.js`           |
| App           | Helmet, CORS, parsers, mount routes      | `configs/app.js`                                |
| Dominio       | Controllers + models + routes            | `src/<domain>/`                                 |
| Cross-cutting | JWT, admin, validators, limits           | `middlewares/`                                  |
| Storage PDF   | Supabase SDK                             | `configs/supabase.js`, `helpers/pdf-storage.js` |
| Storage img   | Cloudinary SDK                           | `configs/cloudinary.js`                         |

## Auth

1. Login/register → access JWT en body + refresh en cookie HttpOnly.
2. Requests: `Authorization: Bearer <access>`.
3. Expiración access → client llama `POST /api/v1/auth/refresh-token` con cookie.
4. Logout limpia cookie.
5. Access y refresh usan secretos distintos (`TOKEN_KEY` / `REFRESH_TOKEN_KEY`).

Passwords: Argon2. Roles en JWT/claims alineados con `User.role`.

## CORS

Allowlist en `middlewares/cors.config.js`:

- `http://localhost:5173`, `http://127.0.0.1:5173`
- `https://biblioteca-sjt.web.app`

`credentials: true` (requerido por refresh cookie).

## Archivos

- Upload libros: Multer 2 (memory) fields `pdf` + `cover`.
- PDF → Supabase (`pdfPublicId` = path). Cover → Cloudinary.
- Entrega: `GET /api/v1/books/:id/pdf` (proxy) o `…/signed-url`.
- **Legacy:** si `pdfUrl` es `https://…` (Cloudinary antiguo), proxy/signed-url siguen funcionando (`resolvePdfSource`).
- Prefijo canónico `/api/v1`. Sin montajes estáticos `/api/pdfs` ni `/api/uploads`.

## Errores

Middleware `handleErrors` al final del pipeline. Preferir `next(err)` desde controllers.

## Deploy

`vercel.json` enruta todo a `index.js` (`@vercel/node`). Ver [DEPLOYMENT.md](./DEPLOYMENT.md).

## Estado as-is y refactor

Inventario, deuda e invariantes: [CURRENT-STATE.md](./CURRENT-STATE.md).

[ROADMAP.md](./ROADMAP.md) es stub hasta redacción formal.
