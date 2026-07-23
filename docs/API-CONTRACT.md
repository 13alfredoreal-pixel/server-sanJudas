# API Contract — Biblioteca Virtual SJT

Fuente de verdad entre **server-sanJudas** y **client-sanjudas**. Actualizar en el mismo PR que cambie endpoints o shapes.

Base URL prod: `https://base-rho-lyart.vercel.app/api/v1`  
Local: `http://localhost:<PORT>/api/v1`

**Versión canónica:** `v1` (`/api/v1/...`).  
Alias legacy `/api/...` (sin versión) sigue montado temporalmente con headers `Deprecation` / `Sunset`; migrar clientes a `/api/v1`.

Auth: header `Authorization: Bearer <accessToken>` salvo donde se indique.  
Cookies: `withCredentials: true` para refresh.

Roles: `USER_ROLE` | `ADMIN_ROLE`.

---

## Auth — `/api/v1/auth`

| Método | Path             | Auth   | Descripción                         |
| ------ | ---------------- | ------ | ----------------------------------- |
| POST   | `/register`      | No     | Multipart opcional `profilePicture` |
| POST   | `/login`         | No     | Rate-limited; setea refresh cookie  |
| POST   | `/refresh-token` | Cookie | Nuevo access token                  |
| POST   | `/logout`        | Cookie | Limpia sesión                       |

## Users — `/api/v1/users`

| Método | Path                       | Auth  | Notas                     |
| ------ | -------------------------- | ----- | ------------------------- |
| GET    | `/`                        | JWT   | Lista usuarios activos    |
| GET    | `/me`                      | JWT   | Perfil actual             |
| PUT    | `/update`                  | JWT   | Perfil ± `profilePicture` |
| PATCH  | `/update-password`         | JWT   | Cambio password           |
| PATCH  | `/promote/:id`             | Admin | → `ADMIN_ROLE`            |
| DELETE | `/delete/:id`              | JWT   | Propietario o admin       |
| POST   | `/toggle-favorite/:bookId` | JWT   |                           |
| GET    | `/favorites`               | JWT   | Libros populados          |
| PATCH  | `/reading-progress`        | JWT   | Body: `{ bookId, page }`  |

## Books — `/api/v1/books`

| Método | Path              | Auth      | Notas                                               |
| ------ | ----------------- | --------- | --------------------------------------------------- |
| GET    | `/`               | JWT       | Filtros + paginación                                |
| GET    | `/:id`            | JWT       | Detalle                                             |
| POST   | `/`               | Admin     | Multipart: `pdf`, `cover`                           |
| DELETE | `/:id`            | Admin     | Borra DB + PDF (Supabase/legacy) + cover Cloudinary |
| GET    | `/:id/pdf`        | Ver impl. | Proxy stream PDF                                    |
| GET    | `/:id/signed-url` | JWT       | `{ signedUrl }`                                     |

Campos Book relevantes: `title`, `author`, `category`, `description`, `pdfUrl` (legacy HTTP opcional), `pdfPublicId` (path Supabase o id legacy), `coverUrl`, `coverPublicId`, `uploadedBy`.

PDFs: **Supabase Storage**. Portadas: **Cloudinary**. Ver [STORAGE-SUPABASE.md](./STORAGE-SUPABASE.md).

## Categories — `/api/v1/categories`

| Método | Path   | Auth  |
| ------ | ------ | ----- |
| GET    | `/`    | JWT   |
| POST   | `/`    | Admin |
| DELETE | `/:id` | Admin |

## Reviews — `/api/v1/reviews`

| Método | Path            | Auth                |
| ------ | --------------- | ------------------- |
| POST   | `/`             | JWT                 |
| GET    | `/book/:bookId` | JWT                 |
| DELETE | `/:id`          | JWT (autor o admin) |

## Analytics — `/api/v1/analytics`

| Método | Path | Auth  |
| ------ | ---- | ----- |
| GET    | `/`  | Admin | Contadores, top reviewed, recent users |

## Estáticos

Ya no hay montajes `/api/pdfs` ni `/api/uploads`. PDFs vía **Supabase** (`/books/:id/pdf` proxy o `signed-url`; dual-path HTTP legacy si `pdfUrl` es URL). Avatares = URL Cloudinary en `profilePicture`.

---

## Errores

Respuestas de error JSON vía `handleErrors`. El client debe tratar 401 con intento de refresh y reintento en cola.

## Cambio de contrato

1. Editar este archivo.
2. Implementar en server.
3. Actualizar `client-sanjudas/docs/API-CONSUMER.md` + código client.
4. Enlazar PRs cross-repo.
