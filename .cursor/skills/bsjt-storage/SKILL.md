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

| Método | Path                           | Notas                                 |
| ------ | ------------------------------ | ------------------------------------- |
| POST   | `/api/v1/books`                | Admin; PDF→Supabase, cover→Cloudinary |
| GET    | `/api/v1/books/:id/pdf`        | Proxy JWT                             |
| GET    | `/api/v1/books/:id/signed-url` | Signed Supabase (1h) o URL legacy     |

## Al implementar

1. PDF: `uploadPdfBuffer` → guardar path en `pdfPublicId`.
2. Cover: Cloudinary image → `coverUrl`/`coverPublicId`.
3. Delete: `removePdfObject` + destroy cover Cloudinary.
4. Legacy: si `pdfUrl` es `https://…`, proxy/axios sigue funcionando.

## Seguridad

- Service role solo en server.
- No exponer Cloudinary `api_secret` ni service role al client.
