# Supabase Storage — PDFs

PDFs de la biblioteca viven en **Supabase Storage** (archivo opaco, sin límite de páginas tipo Cloudinary).  
Portadas y avatares siguen en **Cloudinary**.

## Setup en dashboard Supabase

1. Crear proyecto en [supabase.com](https://supabase.com).
2. **Storage** → New bucket:
   - Name: `biblioteca-pdfs` (o el valor de `SUPABASE_PDF_BUCKET`)
   - **Private** (no public)
3. Project Settings → API:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` (solo server; **nunca** en el client)

## Variables

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PDF_BUCKET=biblioteca-pdfs
```

## Comportamiento API

| Acción                                 | Storage                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| `POST /api/v1/books/upload-url`        | Genera signed **upload** URL (~2 h) + `path` (`pdfs/…pdf`)     |
| Client `PUT` a `signedUrl`             | PDF directo al bucket (sin pasar por Vercel body)              |
| `POST /api/v1/books` (`pdfPublicId`)   | Verifica objeto en bucket → `Book.pdfPublicId`                 |
| `POST /api/v1/books` (multipart `pdf`) | Legacy/local: buffer → Supabase (tope ~4.5 MB en Vercel)       |
| `POST /api/v1/books` (cover)           | Cloudinary → `coverUrl` / `coverPublicId`                      |
| `GET /api/v1/books/:id/signed-url`     | Signed URL lectura Supabase (1h) o URL legacy Cloudinary       |
| `GET /api/v1/books/:id/pdf`            | Proxy stream (Supabase o HTTP legacy)                          |
| `DELETE /api/v1/books/:id`             | Borra PDF en Supabase (o Cloudinary legacy) + cover Cloudinary |

Libros **antiguos** con `pdfUrl` https (Cloudinary) siguen leyéndose por proxy (`resolvePdfSource` → `kind: 'http'`).

Libros **nuevos**: `pdfUrl` vacío; `pdfPublicId` = path Supabase. No migrar en masa salvo ticket explícito.

## Límite Vercel

Las Functions rechazan bodies > ~4.5 MB. Por eso el flujo canónico es **signed upload** + metadata; no subir el PDF completo por `POST /books` en producción.

## Nota de seguridad

Usar siempre la **service role** en el backend. El SPA **no** recibe la service role: solo URLs firmadas (upload o lectura) emitidas por el API con JWT admin/usuario.
