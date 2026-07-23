# GitHub Workflow — server-sanJudas

Repositorio: [13alfredoreal-pixel/server-sanJudas](https://github.com/13alfredoreal-pixel/server-sanJudas)

Prefijo de tickets: **BSJT** (compartido conceptualmente con el client; cada issue vive en el repo dueño).

## Nomenclatura

| Elemento | Formato                                                       |
| -------- | ------------------------------------------------------------- |
| Issue    | `[BSJT-012] Descripción`                                      |
| Épica    | `[BSJT-001] [EPIC] Título` (etapas del ROADMAP cuando exista) |
| Rama     | `BSJT-012` (solo el ID)                                       |
| PR       | `[BSJT-012] …` + `Closes #12`                                 |

GitHub usa `#12` internamente; **BSJT-012** es la referencia humana.

### Próximo ID

```bash
gh issue list --repo 13alfredoreal-pixel/server-sanJudas --state all --limit 30 --json number,title
gh issue list --repo 13alfredoreal-pixel/client-sanjudas --state all --limit 30 --json number,title
```

Elige el siguiente `BSJT-XXX` incremental **global** (mira ambos remotes para no chocar).

## Labels sugeridos

- `feature` / `bug` / `task`
- `repo:server`
- Módulo: `auth`, `books`, `users`, `docs`, `ci`

## Cross-repo

Si el cambio afecta UI:

1. PR en server (contrato + API).
2. PR en client (`Related PR: <url>`).
3. Merge coordinado (API primero si es breaking).

## Flujo diario

```bash
git checkout master   # o main
git pull
gh issue create --title "[BSJT-012] …"
git checkout -b BSJT-012
# … commits …
git push -u origin BSJT-012
gh pr create --title "[BSJT-012] …" --body "Closes #N"
```

No merge sin CI verde. Sin secretos en el diff.

## Refs

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CURRENT-STATE.md](./CURRENT-STATE.md)
- [ROADMAP.md](./ROADMAP.md) (stub — pendiente)
- `.cursor/skills/bsjt-github-workflow/`
