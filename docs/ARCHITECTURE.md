# Arquitectura — server-sanJudas

## Vista general

```
Client (Firebase Hosting)
    │  HTTPS + cookies
    ▼
Express (Vercel)  ──►  MongoDB
    │
    └──► Cloudinary (PDF + covers + avatars)
```

## Capas

| Capa | Responsabilidad | Ubicación |
|------|-----------------|-----------|
| Bootstrap | dotenv, DNS Atlas, listen | `index.js` |
| App | Helmet, CORS, parsers, mount routes | `configs/app.js` |
| Dominio | Controllers + models + routes | `src/<domain>/` |
| Cross-cutting | JWT, admin, validators, limits | `middlewares/` |
| Storage | Cloudinary SDK | `configs/cloudinary.js` |

## Auth

1. Login/register → access JWT en body + refresh en cookie HttpOnly.
2. Requests: `Authorization: Bearer <access>`.
3. Expiración access → client llama `POST /api/auth/refresh-token` con cookie.
4. Logout limpia cookie.

Passwords: Argon2. Roles en JWT/claims alineados con `User.role`.

## CORS

Allowlist en `middlewares/cors.config.js`:

- `http://localhost:5173`, `http://127.0.0.1:5173`
- `https://biblioteca-sjt.web.app`

`credentials: true` (requerido por refresh cookie).

## Archivos

- Upload libros: Multer fields `pdf` + `cover` → Cloudinary.
- Entrega: `GET /api/books/:id/pdf` (proxy) o `…/signed-url`.
- Legacy estático: `/api/pdfs` (JWT), `/api/uploads`.

## Errores

Middleware `handleErrors` al final del pipeline. Preferir `next(err)` desde controllers.

## Deploy

`vercel.json` enruta todo a `index.js` (`@vercel/node`). Ver [DEPLOYMENT.md](./DEPLOYMENT.md).

## Estado as-is y refactor

Inventario, deuda e invariantes: [CURRENT-STATE.md](./CURRENT-STATE.md).

[ROADMAP.md](./ROADMAP.md) es stub hasta redacción formal.
