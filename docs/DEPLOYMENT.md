# Deployment — server-sanJudas

## Producción

| Recurso | Valor                                  |
| ------- | -------------------------------------- |
| Host    | Vercel                                 |
| Entry   | `index.js` vía `@vercel/node`          |
| URL     | `https://base-rho-lyart.vercel.app`    |
| Config  | `vercel.json`                          |
| Node    | **22.x** (`engines` en `package.json`) |
| PM      | **pnpm@11.2.2** (Corepack en install)  |

### Por qué fallaba un proyecto Vercel nuevo

Vercel detecta `lockfileVersion: 9.0` y elige **pnpm 9/10**, que **no entiende** `pnpm@11` ni `allowBuilds` → `pnpm install` sale con 1.

**Fix en repo (BSJT-014):** `installCommand` activa Corepack y fija `pnpm@11.2.2` antes del install. También `ENABLE_EXPERIMENTAL_COREPACK=1` en `vercel.json`.

### Notas de build

- `prepare`: `husky || true` (no tumba install en Vercel).
- No fijar `NODE_ENV=production` en `vercel.json`.
- `argon2`: `allowBuilds` en `pnpm-workspace.yaml`.

## Crear / recrear el proyecto en Vercel (dueño de la cuenta)

1. **Import Git Repository** → `server-sanJudas` (rama `master`).
2. **Framework Preset:** Other.
3. **Root Directory:** `.` (raíz del repo).
4. **Build Command:** dejar vacío / no override (el entry es serverless vía `vercel.json`).
5. **Output Directory:** vacío.
6. **Install Command:** no override (usa el de `vercel.json`).
7. **Node.js Version:** **22.x**.
8. Añadir variables de entorno (abajo) **antes** del primer deploy si puedes; si no, el install igual debe pasar y el runtime fallará hasta configurarlas.
9. Deploy.

Si el log aún dice `Using pnpm@9.x`, confirma que el deploy usa el commit con BSJT-014 (`installCommand` con `corepack prepare pnpm@11.2.2`).

## Variables en Vercel

Configurar en el dashboard (no en git):

- `URI_MONGODB`
- `TOKEN_KEY`
- `REFRESH_TOKEN_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PDF_BUCKET` (opcional, default `biblioteca-pdfs`)
- `ADMIN_PASSWORD` (solo si no hay admin en la DB)
- `PORT` (si aplica)

## MongoDB

Atlas u otro cluster. El bootstrap ajusta DNS (`8.8.8.8`, etc.) para mitigar `querySrv` en algunos entornos.

## Storage

- **PDFs:** Supabase Storage — ver [STORAGE-SUPABASE.md](./STORAGE-SUPABASE.md)
- **Imágenes (portadas/avatars):** Cloudinary

## CORS

Tras cambiar dominio del frontend, actualizar `middlewares/cors.config.js` (allowlist) y redeploy.

## Checklist post-deploy

- [ ] `POST /api/v1/auth/login` responde
- [ ] `GET /api/v1/books` con JWT
- [ ] Upload libro admin (PDF Supabase + cover Cloudinary) OK
- [ ] Proxy/signed PDF OK desde `biblioteca-sjt.web.app`
- [ ] Admin seed no duplica admins innecesariamente
