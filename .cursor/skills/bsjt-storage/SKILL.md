---
name: bsjt-storage
description: >-
  Imágenes (portadas/avatars) en Cloudinary y PDFs en Supabase Storage.
  Usar al tocar upload de libros, proxy PDF, signed URL, configs/cloudinary o configs/supabase.
---

# BSJT — Storage libros

## División

| Asset            | Provider                              | Config                                          |
| ---------------- | ------------------------------------- | ----------------------------------------------- |
| PDF              | **Supabase Storage** (bucket privado) | `configs/supabase.js`, `helpers/pdf-storage.js` |
| Portada / avatar | **Cloudinary**                        | `configs/cloudinary.js`                         |

Ver `docs/STORAGE-SUPABASE.md`.

## Env

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PDF_BUCKET=biblioteca-pdfs
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Book fields

- `pdfPublicId` — path Supabase (`pdfs/...pdf`) o public_id Cloudinary legacy
- `pdfUrl` — URL HTTP legacy Cloudinary; vacío en libros nuevos
- `coverUrl` / `coverPublicId` — Cloudinary

## Endpoints

| Método | Path                           | Notas                                           |
| ------ | ------------------------------ | ----------------------------------------------- |
| POST   | `/api/v1/books/upload-url`     | Admin; signed upload PDF (bypass Vercel 4.5 MB) |
| POST   | `/api/v1/books`                | Admin; `pdfPublicId` o multipart `pdf` + cover  |
| GET    | `/api/v1/books/:id/pdf`        | Proxy JWT                                       |
| GET    | `/api/v1/books/:id/signed-url` | Signed lectura Supabase (1h) o URL legacy       |

## Al implementar

1. Prod: `createPdfSignedUploadUrl` → client PUT → `POST /books` con `pdfPublicId`.
2. Legacy/local: `uploadPdfBuffer` → path en `pdfPublicId` (no usar para PDFs grandes en Vercel).
3. Cover: Cloudinary image → `coverUrl`/`coverPublicId`.
4. Delete: `removePdfObject` + destroy cover Cloudinary.
5. Legacy lectura: si `pdfUrl` es `https://…`, proxy/axios sigue funcionando.

## Seguridad

- Service role solo en server.
- No exponer Cloudinary `api_secret` ni service role al client.
- Validar `pdfPublicId` con `PDF_OBJECT_PATH_RE` + `pdfObjectExists` antes de crear el Book.
