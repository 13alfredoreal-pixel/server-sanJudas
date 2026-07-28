# server-sanJudas — API Biblioteca Virtual SJT

Backend REST de la biblioteca digital institucional **San Judas Tadeo**.

|                  |                                                                           |
| ---------------- | ------------------------------------------------------------------------- |
| Frontend hermano | [client-sanjudas](https://github.com/13alfredoreal-pixel/client-sanjudas) |
| Agentes          | [AGENTS.md](./AGENTS.md)                                                  |
| Contrato API     | [docs/API-CONTRACT.md](./docs/API-CONTRACT.md)                            |
| Estado as-is     | [docs/CURRENT-STATE.md](./docs/CURRENT-STATE.md)                          |

**Dos repos independientes** (no monorepo). Clonar ambos si desarrollas full-stack:

```bash
git clone https://github.com/13alfredoreal-pixel/server-sanJudas.git
git clone https://github.com/13alfredoreal-pixel/client-sanjudas.git
```

| Capa            | URL prod                          |
| --------------- | --------------------------------- |
| API (este repo) | https://base-rho-lyart.vercel.app |
| SPA             | https://biblioteca-sjt.web.app    |

## Stack

Express 5 · Mongoose/MongoDB · JWT + Argon2 · Cloudinary · Multer · Helmet · CORS · rate-limit · Vercel

## Requisitos

- Node.js 20+ (CI / Vercel: **24.x**)
- MongoDB (local o Atlas)
- Cuenta Cloudinary (PDFs y portadas)

## Quickstart

```bash
cp .env.example .env
# Completar URI_MONGODB, TOKEN_KEY, CLOUDINARY_*

pnpm install
pnpm  dev
```

El servidor escucha en `process.env.PORT` (típicamente `3000`).

Al arrancar se ejecuta el seed de admin si no existe ningún `ADMIN_ROLE`.

En otra terminal, arranca el client (`pnpm  dev` en client-sanjudas) si necesitas la UI.

## Scripts

| Comando     | Descripción                 |
| ----------- | --------------------------- |
| `pnpm  dev` | Nodemon                     |
| `npm start` | Node producción             |
| `npm test`  | Placeholder (sin suite aún) |

## Variables de entorno

Ver [`.env.example`](./.env.example). Nunca subas `.env` al remoto.

## Deploy

Vercel (`vercel.json` → `index.js` con `@vercel/node`). Detalle: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

Producción actual: `https://base-rho-lyart.vercel.app`

## Estructura

```
configs/     app.js, db.js, cloudinary.js
src/         auth, users, books, categories, reviews, analytics, audit
middlewares/ JWT, admin, validators, CORS, limits
docs/        arquitectura, contrato, current-state, workflow
```

## Contribución

Prefijo de tickets **BSJT**. Ver [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) y [docs/GITHUB-WORKFLOW.md](./docs/GITHUB-WORKFLOW.md).

Antes de refactor: [docs/CURRENT-STATE.md](./docs/CURRENT-STATE.md). ROADMAP aún pendiente.
