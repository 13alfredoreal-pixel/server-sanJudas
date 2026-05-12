// ataque.mjs
// Auditoria defensiva local de autenticacion y rate limit
// Uso: node ataque.mjs

const BASE = "http://localhost:3000/api";
const LOGIN_URL = `${BASE}/auth/login`;

const LOGIN_DICTIONARY = [
  { email: "admin@test.com", password: "123456" },
  { email: "admin@test.com", password: "password" },
  { email: "user@test.com", password: "qwerty" },
  { email: "root@test.com", password: "admin123" },
  { email: "fake@test.com", password: "letmein" },
  { email: "fake@test.com", password: "incorrecta" },
  { email: "demo@test.com", password: "123123" },
];

const ROUTE_CHECKS = [

  { name: "Login", method: "POST", path: "/auth/login", expect: "public", body: { email: "test@test.com", password: "test" } },
  { name: "Register", method: "POST", path: "/auth/register", expect: "public", body: { name: "Test", email: "test@test.com", password: "test" } },
  { name: "Refresh Token", method: "POST", path: "/auth/refresh-token", expect: "public" },
  { name: "Logout", method: "POST", path: "/auth/logout", expect: "public" },

  { name: "List Users", method: "GET", path: "/users", expect: "auth_required" },
  { name: "Get My Profile", method: "GET", path: "/users/me", expect: "auth_required" },
  { name: "Update Profile", method: "PUT", path: "/users/update", expect: "auth_required" },
  { name: "Update Password", method: "PATCH", path: "/users/update-password", expect: "auth_required" },
  { name: "Promote User", method: "PATCH", path: "/users/promote/507f1f77bcf86cd799439011", expect: "auth_required" },
  { name: "Delete User", method: "DELETE", path: "/users/delete/507f1f77bcf86cd799439011", expect: "auth_required" },
  { name: "Toggle Favorite", method: "POST", path: "/users/toggle-favorite/507f1f77bcf86cd799439011", expect: "auth_required" },
  { name: "Get Favorites", method: "GET", path: "/users/favorites", expect: "auth_required" },
  { name: "Update Reading Progress", method: "PATCH", path: "/users/reading-progress", expect: "auth_required" },

  { name: "List Books", method: "GET", path: "/books", expect: "auth_required" },
  { name: "Get Book by ID", method: "GET", path: "/books/507f1f77bcf86cd799439011", expect: "auth_required" },
  { name: "Create Book", method: "POST", path: "/books", expect: "auth_required" },
  { name: "Delete Book", method: "DELETE", path: "/books/507f1f77bcf86cd799439011", expect: "auth_required" },

  { name: "List Categories", method: "GET", path: "/categories", expect: "auth_required" },
  { name: "Create Category", method: "POST", path: "/categories", expect: "auth_required" },
  { name: "Delete Category", method: "DELETE", path: "/categories/507f1f77bcf86cd799439011", expect: "auth_required" },

  { name: "Add Review", method: "POST", path: "/reviews", expect: "auth_required" },
  { name: "Get Reviews by Book", method: "GET", path: "/reviews/book/507f1f77bcf86cd799439011", expect: "auth_required" },
  { name: "Delete Review", method: "DELETE", path: "/reviews/507f1f77bcf86cd799439011", expect: "auth_required" },

  { name: "Get Analytics", method: "GET", path: "/analytics", expect: "auth_required" },
];

const INVALID_TOKEN = "Bearer token.invalido.aqui";

function isUnauthorized(status) {
  return status === 401 || status === 403;
}

function is2xx(status) {
  return status >= 200 && status < 300;
}

function evaluateByExpectation(status, expect) {
  if (expect === "public") {
    return is2xx(status) || status === 400 || status === 404 || status === 429;
  }

  if (expect === "auth_required") {
    if (isUnauthorized(status) || status === 400 || status === 429) return true;
    if (is2xx(status)) return false;
    return false;
  }

  return false;
}

async function requestRoute(route, extraHeaders = {}) {
  const url = `${BASE}${route.path}`;
  const res = await fetch(url, {
    method: route.method,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: (route.body && route.method !== "GET") ? JSON.stringify(route.body) : undefined,
  });

  let bodyText = "";
  try {
    bodyText = await res.text();
  } catch {
    bodyText = "";
  }

  return { res, bodyText };
}

async function testLoginRateLimit() {
  console.log(`\n[1] Probando rate limit en login: ${LOGIN_URL}\n`);

  for (let i = 0; i < 70; i++) {
    const creds = LOGIN_DICTIONARY[i % LOGIN_DICTIONARY.length];
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });

    if (i % 10 === 0 || res.status === 429) {
        console.log(`Intento #${i + 1} -> HTTP ${res.status}`);
    }

    if (res.status === 429) {
      const body = await res.text();
      console.log("\nOK: Rate limit activado (429).");
      console.log("Mensaje:", body);
      return true;
    }
  }

  console.log("\nFAIL: No se activó 429 en login tras 70 intentos.");
  return false;
}

async function testRoutesNoToken() {
  console.log(`\n[2] Probando rutas SIN token\n`);
  let allGood = true;

  for (const route of ROUTE_CHECKS) {
    const { res, bodyText } = await requestRoute(route);
    const ok = evaluateByExpectation(res.status, route.expect);

    console.log(
      `${route.name.padEnd(25)} [${route.method.padEnd(6)} ${route.path.slice(0, 30).padEnd(30)}] -> ${res.status} ${ok ? "OK" : "FAIL"}`
    );

    if (!ok) {
      allGood = false;
      console.log(`  Respuesta: ${bodyText.slice(0, 100)}...`);
    }
  }

  return allGood;
}

async function testRoutesInvalidToken() {
  console.log(`\n[3] Probando rutas con token INVALIDO\n`);
  let allGood = true;

  for (const route of ROUTE_CHECKS) {
    const { res, bodyText } = await requestRoute(route, {
      Authorization: INVALID_TOKEN,
    });
    const ok = evaluateByExpectation(res.status, route.expect);

    console.log(
      `${route.name.padEnd(25)} [${route.method.padEnd(6)} ${route.path.slice(0, 30).padEnd(30)}] -> ${res.status} ${ok ? "OK" : "FAIL"}`
    );

    if (!ok) {
      allGood = false;
      console.log(`  Respuesta: ${bodyText.slice(0, 100)}...`);
    }
  }

  return allGood;
}

async function stressAuthRouteNoToken() {
  const target = ROUTE_CHECKS.find((r) => r.expect === "auth_required");
  if (!target) {
    console.log("\n[4] Sin prueba de repeticion: no hay rutas auth_required.");
    return true;
  }

  console.log(`\n[4] Repeticiones sin token (IP limit) sobre ${target.method} ${target.path}\n`);

  let allGood = true;

  for (let i = 1; i <= 70; i++) {
    const { res } = await requestRoute(target);

    if (res.status === 429) {
        console.log(`Intento #${i} -> HTTP ${res.status} OK (Bloqueado por Rate Limit)`);
        return true;
    }

    if (i % 10 === 0) {
        console.log(`Intento #${i} -> HTTP ${res.status}`);
    }

    const ok = isUnauthorized(res.status) || res.status === 400;
    if (!ok && res.status !== 429) {
        allGood = false;
        console.log(`FAIL: La ruta permitió acceso o dio error inesperado: ${res.status}`);
    }
  }

  console.log("FAIL: No se activó 429 tras 70 peticiones a ruta protegida.");
  return false;
}

async function main() {
  console.log("=====================================================");
  console.log("AUDITORIA DE SEGURIDAD - PROYECTO COMPLETO");
  console.log("=====================================================");

  const r1 = await testLoginRateLimit();
  const r2 = await testRoutesNoToken();
  const r3 = await testRoutesInvalidToken();
  const r4 = await stressAuthRouteNoToken();

  console.log("\n===== RESUMEN DE SEGURIDAD =====");
  console.log(`1. Rate limit en Login:       ${r1 ? "PASÓ" : "FALLÓ"}`);
  console.log(`2. Rutas sin token:           ${r2 ? "PASÓ" : "FALLÓ"}`);
  console.log(`3. Rutas token inválido:      ${r3 ? "PASÓ" : "FALLÓ"}`);
  console.log(`4. Rate limit por IP (Rutas): ${r4 ? "PASÓ" : "FALLÓ"}`);

  if (!r1 || !r2 || !r3 || !r4) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Error en auditoria:", err);
  process.exit(1);
});