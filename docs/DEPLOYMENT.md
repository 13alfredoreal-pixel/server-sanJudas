# Deployment — server-sanJudas

## Producción

| Recurso | Valor |
|---------|-------|
| Host | Vercel |
| Entry | `index.js` vía `@vercel/node` |
| URL | `https://base-rho-lyart.vercel.app` |
| Config | `vercel.json` |

## Variables en Vercel

Configurar en el dashboard (no en git):

- `URI_MONGODB`
- `TOKEN_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PORT` (si aplica en el runtime)

## MongoDB

Atlas u otro cluster. El bootstrap ajusta DNS (`8.8.8.8`, etc.) para mitigar `querySrv` en algunos entornos.

## Cloudinary

Folders de biblioteca (`biblioteca/pdfs`, `biblioteca/portadas` / `SJT/…`). Rotar secrets si se filtran.

## CORS

Tras cambiar dominio del frontend, actualizar `middlewares/cors.config.js` (allowlist) y redeploy.

## Checklist post-deploy

- [ ] `POST /api/auth/login` responde
- [ ] `GET /api/books` con JWT
- [ ] Upload libro admin (multipart) OK
- [ ] Proxy/signed PDF OK desde `biblioteca-sjt.web.app`
- [ ] Admin seed no duplica admins innecesariamente
