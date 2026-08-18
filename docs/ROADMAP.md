# ROADMAP — Biblioteca Virtual SJT

> **Estado: PENDIENTE (stub formal de producto).** No usarlo como guía de etapas de producto hasta redacción explícita.
>
> Resumen del client: `client-sanjudas/docs/ROADMAP.md`.

## Seguimiento operativo (cerrado / aplazado)

| Ítem                                         | Estado   | Ref             |
| -------------------------------------------- | -------- | --------------- |
| Fundación docs + CI                          | Hecho    | BSJT-001        |
| Refactor pnpm / `src/` / sin uploads local   | Hecho    | BSJT-003        |
| Supabase PDFs + Postman                      | Hecho    | BSJT-004        |
| ESLint / Prettier / Husky (server)           | Hecho    | BSJT-005        |
| Env validation, Multer 2, seed, docs         | Hecho    | BSJT-006        |
| API versionada `/api/v1`                     | Hecho    | BSJT-009        |
| Alinear client + tooling client              | Hecho    | client 007/008  |
| Branding client Biblioteca Virtual SJT       | Hecho    | client BSJT-010 |
| Deploy Vercel pnpm 11 + Corepack             | En curso | BSJT-014        |
| Signed upload PDF (bypass Vercel 4.5 MB)     | Hecho    | BSJT-016        |
| signed-url: no 500 genérico (Storage/legacy) | En curso | BSJT-018        |
| Rotación secretos históricos en git          | Aplazado | —               |
| Tests automatizados API                      | Aplazado | —               |

**API lista para pruebas locales:** `pnpm dev` + Postman `baseUrl=http://localhost:3000/api/v1`.

Fuente de verdad operativa:

- [AGENTS.md](../AGENTS.md)
- [API-CONTRACT.md](./API-CONTRACT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CURRENT-STATE.md](./CURRENT-STATE.md)
