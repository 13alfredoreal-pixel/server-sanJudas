# AGENTS.md — server-sanJudas

Instrucciones del repositorio **API Biblioteca Virtual SJT**. Léelas antes de implementar. Toda la documentación versionada vive **dentro de este repo** (o del client hermano); no hay docs en una carpeta padre.

## Proyecto

REST API de la biblioteca digital institucional San Judas Tadeo. Autenticación JWT, catálogo de libros (PDF en Cloudinary), usuarios, categorías, reseñas, analytics y auditoría.

**No es monorepo.** El frontend es otro remoto. Contrato entre capas = HTTP/JSON ([docs/API-CONTRACT.md](docs/API-CONTRACT.md)).

**Repo hermano (frontend):** [client-sanjudas](https://github.com/13alfredoreal-pixel/client-sanjudas) — clone aparte; PRs separados; enlazar con `Related PR` si el cambio cruza.

### Ownership

- Editar solo este repo salvo coordinación explícita con el client.
- Cambios de shapes/endpoints: actualizar `docs/API-CONTRACT.md` aquí primero; el client actualiza `docs/API-CONSUMER.md` + código.
- El client nunca habla con Mongo/Cloudinary directo.

## Stack

| Capa | Tecnología | Ruta |
|------|------------|------|
| HTTP | Express 5 (ESM) | `index.js`, `configs/app.js` |
| BD | MongoDB + Mongoose | `configs/db.js`, `src/**/*.model.js` |
| Auth | JWT + Argon2 + cookie refresh | `src/auth/`, `middlewares/jwt-verify.js` |
| Files | Multer (memory) + Cloudinary | `configs/cloudinary.js`, `src/books/` |
| Deploy | Vercel (`@vercel/node`) | `vercel.json` |

**Gestor de paquetes:** solo **pnpm** (`pnpm install`). No usar npm/yarn.

## Estructura

```
configs/           → app, db, cloudinary
src/
  auth/            → register, login, refresh, logout
  users/           → perfil, favoritos, progreso, promote
  books/           → CRUD-ish, PDF proxy, signed URL (Cloudinary)
  categories/
  reviews/
  analytics/       → admin stats
  audit/           → AuditLog
middlewares/       → JWT, admin, validators, CORS, rate-limit, multer memory
helpers/
docs/
.cursor/rules/
.cursor/skills/
```

Antes de un refactor: leer [docs/CURRENT-STATE.md](docs/CURRENT-STATE.md).

## Comandos esenciales

```bash
pnpm install
pnpm dev      # nodemon
pnpm start
```

Variables: copiar `.env.example` → `.env`. Nunca commitear `.env`.

## Workflow BSJT (obligatorio)

1. Issue: `[BSJT-XXX] Descripción` en **este** repo.
2. Rama = solo el ID: `BSJT-012`.
3. PR: `[BSJT-012] …` + `Closes #<n>`.
4. Cambios que afecten al client: abrir PR hermano y enlazar `Related PR`.
5. Actualizar `docs/API-CONTRACT.md` si cambian endpoints o shapes.

Ver [docs/GITHUB-WORKFLOW.md](docs/GITHUB-WORKFLOW.md) y [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Roles

`USER_ROLE` (default) | `ADMIN_ROLE` — enum en `src/users/user.model.js`.

Admin seed: `src/users/user.seed.js` (`admin@sanjudas.edu.gt`).

## Dominio

Libros PDF + portadas en Cloudinary; categorías; reseñas 1–5; favoritos y `readingProgress` en User; `AuditLog` en acciones admin. **Sin almacenamiento local de archivos.**

## Convenciones

- Módulos por dominio bajo `src/<domain>/`.
- Preferir **named exports** (`export const`). Default solo en `*.routes.js` (`export default router`) y modelos Mongoose.
- Funciones flecha por defecto (salvo APIs que exijan `function`, p. ej. `schema.methods` con `this`).
- Prefijo `/api/...` montado en `configs/app.js`.
- Docs en español; código en inglés.
- Sin secretos en el diff. Preferir cambios acotados; refactor amplio solo con pedido explícito.
- **ROADMAP pendiente** (stub).

## Índice Cursor

| Tipo | Path |
|------|------|
| Rules | `.cursor/rules/bsjt-project.mdc`, `express-api.mdc`, `mongoose-models.mdc` |
| Skills | `.cursor/skills/bsjt-express-mongo/`, `bsjt-library-domain/`, `bsjt-cloudinary-pdfs/`, `bsjt-github-workflow/` |
| Docs | `docs/` (empezar por `CURRENT-STATE.md` + `API-CONTRACT.md`) |
