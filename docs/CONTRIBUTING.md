# Contributing — server-sanJudas

## Antes de codear

1. Leer [AGENTS.md](../AGENTS.md) y [CURRENT-STATE.md](./CURRENT-STATE.md).
2. Crear issue `[BSJT-XXX]` y rama `BSJT-XXX`.
3. Si tocas endpoints → actualizar [API-CONTRACT.md](./API-CONTRACT.md) (y avisar al client).
4. [ROADMAP.md](./ROADMAP.md) está **pendiente** — no bloquear trabajo por etapas B*.

## Local

```bash
cp .env.example .env
pnpm install
pnpm  dev
```

## PR

- Título `[BSJT-XXX] …`
- Cuerpo con `Closes #N`
- Checklist del template en `.github/PULL_REQUEST_TEMPLATE.md`
- CI verde
- Si hubo refactor de estructura: actualizar `CURRENT-STATE.md` / `AGENTS.md`

## Estilo

- pnpm only
- Docs ES / código EN
- Preferir cambios acotados; refactor amplio solo con pedido explícito + invariantes
- **ESLint** + **Prettier** (ver `eslint.config.js`, `.prettierrc.json`)
- Commits: **Conventional Commits** (Husky `commit-msg`). Ej.: `fix(auth): refresh token secret`
- Antes de push: `pnpm lint && pnpm format:check`

Detalle workflow: [GITHUB-WORKFLOW.md](./GITHUB-WORKFLOW.md).
