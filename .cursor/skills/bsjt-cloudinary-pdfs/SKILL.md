---
name: bsjt-cloudinary-pdfs
description: >-
  Subida y entrega de PDFs/portadas vía Cloudinary en server-sanJudas. Usar al
  tocar upload de libros, proxy PDF, signed URL, migrate-pdfs o configs/cloudinary.
---

# BSJT — Cloudinary / PDFs

## Config

- `configs/cloudinary.js` — env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Carpetas típicas: `biblioteca/pdfs`, `biblioteca/portadas` (o `SJT/…`).

## Book fields

- `pdfUrl`, `pdfPublicId` (required)
- `coverUrl`, `coverPublicId` (optional)

## Endpoints

| Método | Path | Notas |
|--------|------|-------|
| POST | `/api/books` | Admin + multipart (PDF ± cover) |
| GET | `/api/books/:id/pdf` | Proxy PDF (`servePdf`) |
| GET | `/api/books/:id/signed-url` | JWT; URL temporal |

Estáticos legacy: `/api/pdfs` (JWT), `/api/uploads` (assets locales).

## Al implementar

1. Subir a Cloudinary → guardar URL + publicId.
2. Al borrar libro: destruir assets Cloudinary.
3. Timeouts client ~120s para uploads grandes.
4. Script legado: `migrate-pdfs-to-cloudinary.js` — no usarlo en flujo normal.

## Seguridad

- No exponer `api_secret`.
- Preferir proxy/signed URL frente a URLs públicas permanentes cuando el flujo ya lo use.
