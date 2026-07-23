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

| Acción                          | Storage                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `POST /api/books` (pdf)         | Supabase path → `Book.pdfPublicId`                             |
| `POST /api/books` (cover)       | Cloudinary → `coverUrl` / `coverPublicId`                      |
| `GET /api/books/:id/signed-url` | Signed URL Supabase (1h) o URL legacy Cloudinary               |
| `GET /api/books/:id/pdf`        | Proxy stream (Supabase o HTTP legacy)                          |
| `DELETE /api/books/:id`         | Borra PDF en Supabase (o Cloudinary legacy) + cover Cloudinary |

Libros **antiguos** con `pdfUrl` https (Cloudinary) siguen leyéndose por proxy (`resolvePdfSource` → `kind: 'http'`).

Libros **nuevos**: `pdfUrl` vacío; `pdfPublicId` = path Supabase. No migrar en masa salvo ticket explícito.

## Nota de seguridad

Usar siempre la **service role** en el backend. El SPA solo obtiene el PDF vía endpoints JWT del API.
