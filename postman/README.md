# Postman — Biblioteca Virtual SJT

## Importar

1. Postman → **Import**
2. Archivos:
   - [`BSJT-API.postman_collection.json`](./BSJT-API.postman_collection.json)
   - [`BSJT-Local.postman_environment.json`](./BSJT-Local.postman_environment.json)
   - (opcional) [`BSJT-Production.postman_environment.json`](./BSJT-Production.postman_environment.json)
3. Selector de environment arriba a la derecha → **BSJT Local**

## Orden de prueba sugerido

1. `Auth → Login (admin)` — guarda `accessToken`
2. `Auth → Refresh token` — confirma cookie + nuevo access
3. `Users → Get me`
4. `Books → List books` / `Upload book` (elige PDF local en form-data)
5. `Books → Get PDF signed URL` / `Proxy PDF stream`
6. `Categories` / `Reviews` / `Analytics`
7. `Negative / smoke` — 401 sin token; 404 en estáticos legacy

## Notas

- Cookies: Postman debe conservar cookies de `localhost` para refresh/logout.
- Upload libro: campo `pdf` obligatorio; `cover` opcional.
- Admin seed: username/email desde env (`ADMIN_USERNAME` / `ADMIN_EMAIL`); password = `ADMIN_PASSWORD` en `.env` del server (no hardcodeada). Ajusta `adminPassword` en el environment Postman al mismo valor.
- Contrato: [`docs/API-CONTRACT.md`](../docs/API-CONTRACT.md)
