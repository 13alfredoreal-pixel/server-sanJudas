---
name: bsjt-library-domain
description: >-
  Dominio de biblioteca SJT: libros, categorías, reseñas, favoritos, progreso
  de lectura, roles USER/ADMIN y auditoría. Usar al implementar features de
  catálogo, admin upload, reviews o analytics.
---

# BSJT — Dominio biblioteca

## Roles

| Rol          | Puede                                                              |
| ------------ | ------------------------------------------------------------------ |
| `USER_ROLE`  | Catálogo, leer PDF, favoritos, progreso, reviews propias, perfil   |
| `ADMIN_ROLE` | + upload/delete books, categories, promote/delete users, analytics |

## Entidades

| Modelo   | Notas                                                          |
| -------- | -------------------------------------------------------------- |
| User     | perfil, favorites[], readingProgress[], role, status           |
| Book     | title, author, category, description, pdf*, cover*, uploadedBy |
| Category | name, icon                                                     |
| Review   | book, user, rating 1–5, comment                                |
| AuditLog | acciones admin (CREATE_BOOK, DELETE_BOOK, PROMOTE_USER, …)     |

## Flujos clave

1. **Auth** — register/login → access token + refresh cookie.
2. **Catálogo** — list/filter books; get by id.
3. **Lectura** — proxy PDF o signed URL Cloudinary.
4. **Social** — toggle favorite; add/delete review.
5. **Admin** — multipart upload book; stats `/api/analytics`.

## Canon

- Contrato: `docs/API-CONTRACT.md`
- Arquitectura: `docs/ARCHITECTURE.md`
- As-is / deuda: `docs/CURRENT-STATE.md`
- ROADMAP: stub pendiente — no usar como guía
