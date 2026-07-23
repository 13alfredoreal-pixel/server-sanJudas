---
name: bsjt-express-mongo
description: >-
  Implementa módulos Express + Mongoose en server-sanJudas (rutas, controllers,
  models, middlewares). Usar al crear endpoints, validadores, seeds o al tocar
  src/, middlewares/ o configs/app.js.
---

# BSJT — Express + Mongo

## Módulos existentes

| Prefijo | Carpeta |
|---------|---------|
| `/api/auth` | `src/auth/` |
| `/api/users` | `src/users/` |
| `/api/books` | `src/books/` |
| `/api/categories` | `src/categories/` |
| `/api/reviews` | `src/reviews/` |
| `/api/analytics` | `src/analytics/` |

Audit: `src/audit/` (logger, no router propio).

## Nuevo módulo

1. Crear `src/<name>/<name>.model.js` + `.controller.js` + `.routes.js`.
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
