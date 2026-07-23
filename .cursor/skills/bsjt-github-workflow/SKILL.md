---
name: bsjt-github-workflow
description: >-
  Gestiona issues BSJT, ramas y PRs en server-sanJudas. Usar al crear tickets,
  ramas, pull requests o cuando el usuario mencione BSJT, sprint o GitHub Project.
---

# BSJT Server — GitHub Workflow

## Nomenclatura

| Elemento | Formato                       | Ejemplo                            |
| -------- | ----------------------------- | ---------------------------------- |
| Issue    | `[BSJT-012] Título`           | `[BSJT-012] Books: signed URL TTL` |
| Rama     | `BSJT-012`                    | solo el ID                         |
| PR       | `[BSJT-012] …` + `Closes #12` | #12 = número GitHub                |

Label sugerido: `repo:server` (si el org Project es compartido).

## Flujo

```bash
# Consultar último ID usado en título
gh issue list --state all --limit 20 --json number,title

gh issue create --title "[BSJT-012] …" --body "…"
git checkout -b BSJT-012
# … trabajo …
git push -u origin BSJT-012
gh pr create --title "[BSJT-012] …" --body "$(cat <<'EOF'
## Resumen
…

Closes #12

## Related PR
<!-- URL del PR en client-sanjudas si aplica -->
EOF
)"
```

## Cross-repo

Si el contrato API cambia: PR aquí + PR en client; enlazar ambos.

## Refs

- `docs/GITHUB-WORKFLOW.md`
- `docs/CONTRIBUTING.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
