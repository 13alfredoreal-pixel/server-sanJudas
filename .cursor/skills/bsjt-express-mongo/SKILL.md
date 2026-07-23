---
name: bsjt-express-mongo
description: >-
  Implementa módulos Express + Mongoose en server-sanJudas (rutas, controllers,
  models, middlewares). Usar al crear endpoints, validadores, seeds o al tocar
  SRC/, middlewares/ o configs/app.js.
---

# BSJT — Express + Mongo

## Módulos existentes

| Prefijo | Carpeta |
|---------|---------|
| `/api/auth` | `SRC/auth/` |
| `/api/users` | `SRC/users/` |
| `/api/books` | `SRC/books/` |
| `/api/categories` | `SRC/categories/` |
| `/api/reviews` | `SRC/reviews/` |
| `/api/analytics` | `SRC/analytics/` |

Audit: `SRC/audit/` (logger, no router propio).

## Nuevo módulo

1. Crear `SRC/<name>/<name>.model.js` + `.controller.js` + `.routes.js`.
2. Montar en `configs/app.js` → `app.use('/api/<name>', routes)`.
3. Reutilizar `validateJWT`, `isAdmin`, limiters y validators existentes.
4. Actualizar `docs/API-CONTRACT.md`.
5. Si el client consume el endpoint, coordinar PR en client-sanjudas.

## Checklist

- [ ] Validadores en routes
- [ ] Sin password/token en responses
- [ ] Errores pasan a `handleErrors`
- [ ] Contrato y `CURRENT-STATE.md` actualizados si aplica

## Refs

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `.cursor/rules/express-api.mdc`
