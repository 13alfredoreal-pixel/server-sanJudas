# Deployment — server-sanJudas

## Producción

| Recurso | Valor                               |
| ------- | ----------------------------------- |
| Host    | Vercel                              |
| Entry   | `index.js` vía `@vercel/node`       |
| URL     | `https://base-rho-lyart.vercel.app` |
| Config  | `vercel.json`                       |

## Variables en Vercel

Configurar en el dashboard (no en git):

- `URI_MONGODB`
- `TOKEN_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PDF_BUCKET` (opcional, default `biblioteca-pdfs`)
- `PORT` (si aplica en el runtime)

## MongoDB

Atlas u otro cluster. El bootstrap ajusta DNS (`8.8.8.8`, etc.) para mitigar `querySrv` en algunos entornos.

## Storage

- **PDFs:** Supabase Storage — ver [STORAGE-SUPABASE.md](./STORAGE-SUPABASE.md)
- **Imágenes (portadas/avatars):** Cloudinary

## CORS

Tras cambiar dominio del frontend, actualizar `middlewares/cors.config.js` (allowlist) y redeploy.

## Checklist post-deploy

- [ ] `POST /api/auth/login` responde
- [ ] `GET /api/books` con JWT
- [ ] Upload libro admin (PDF Supabase + cover Cloudinary) OK
- [ ] Proxy/signed PDF OK desde `biblioteca-sjt.web.app`
- [ ] Admin seed no duplica admins innecesariamente
