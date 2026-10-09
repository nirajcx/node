import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../../src/app.js";

async function fixture(t, options = {}) {
  const logs = [];
  const logger = Object.fromEntries(
    ["info", "warn", "error"].map((level) => [
      level,
      (...args) => logs.push(args),
    ]),
  );
  const app = createApp({
    config: { FRONTEND_URL: "http://localhost:3000" },
    logger,
    database: { ping: async () => {} },
    redis: { enabled: false, ping: async () => {} },
    ...options,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return { base: `http://127.0.0.1:${server.address().port}`, logs };
}
function assertMeta(body, response) {
  assert.match(body.meta.requestId, /^[a-f0-9-]{36}$/);
  assert.equal(body.meta.requestId, response.headers.get("x-request-id"));
  assert.ok(Number.isFinite(Date.parse(body.meta.timestamp)));
  assert.equal(response.headers.get("cache-control"), "no-store");
}
test("liveness and readiness return the standard success envelope", async (t) => {
  const { base } = await fixture(t);
  for (const path of ["/api/health", "/api/ready"]) {
    const response = await fetch(base + path);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(typeof body.message, "string");
    assertMeta(body, response);
    assert.equal(response.headers.has("x-powered-by"), false);
  }
});
test("dependency failure affects readiness but not liveness and leaks no details", async (t) => {
  const { base, logs } = await fixture(t, {
    database: {
      ping: async () => {
        throw new Error("secret postgres://credentials");
      },
    },
  });
  const response = await fetch(base + "/api/ready");
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error.code, "DEPENDENCY_UNAVAILABLE");
  assert.equal(JSON.stringify(body).includes("secret"), false);
  assert.equal(JSON.stringify(logs).includes("secret"), false);
  assert.equal((await fetch(base + "/api/health")).status, 200);
});
test("readiness fails while shutting down", async (t) => {
  const { base } = await fixture(t, { isShuttingDown: () => true });
  const response = await fetch(base + "/api/ready");
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "SHUTTING_DOWN");
});
test("unknown routes and all unfinished endpoints use the error envelope", async (t) => {
  const { base } = await fixture(t);
  for (const [method, path, status, code] of [
    ["GET", "/missing", 404, "ROUTE_NOT_FOUND"],
    ["POST", "/api/auth/register", 501, "NOT_IMPLEMENTED"],
    ["POST", "/api/auth/login", 501, "NOT_IMPLEMENTED"],
    ["GET", "/api/auth/me", 501, "NOT_IMPLEMENTED"],
    ["POST", "/api/auth/logout", 501, "NOT_IMPLEMENTED"],
    ["GET", "/api/todos", 501, "NOT_IMPLEMENTED"],
    ["POST", "/api/todos", 501, "NOT_IMPLEMENTED"],
    ["PATCH", "/api/todos/example", 501, "NOT_IMPLEMENTED"],
    ["DELETE", "/api/todos/example", 501, "NOT_IMPLEMENTED"],
  ]) {
    const response = await fetch(base + path, { method });
    const body = await response.json();
    assert.equal(response.status, status);
    assert.equal(body.success, false);
    assert.equal(body.data, null);
    assert.equal(body.error.code, code);
    assert.equal(body.error.details, null);
    assertMeta(body, response);
  }
});
test("malformed and oversized JSON are handled before routes", async (t) => {
  const { base } = await fixture(t);
  for (const [body, status, code] of [
    ['{"password":"secret"', 400, "INVALID_JSON"],
    [JSON.stringify({ text: "x".repeat(17000) }), 413, "PAYLOAD_TOO_LARGE"],
  ]) {
    const response = await fetch(base + "/api/todos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const json = await response.json();
    assert.equal(response.status, status);
    assert.equal(json.error.code, code);
    assert.equal(JSON.stringify(json).includes("password"), false);
    assertMeta(json, response);
  }
});
test("CORS accepts the configured origin and rejects others with JSON", async (t) => {
  const { base } = await fixture(t);
  const allowed = await fetch(base + "/api/health", {
    headers: { origin: "http://localhost:3000" },
  });
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "http://localhost:3000",
  );
  assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
  const denied = await fetch(base + "/api/health", {
    headers: { origin: "https://example.org" },
  });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error.code, "ORIGIN_NOT_ALLOWED");
});
test("request ids are server-generated and unique", async (t) => {
  const { base } = await fixture(t);
  const a = await fetch(base + "/api/health", {
    headers: { "x-request-id": "untrusted-id" },
  });
  const b = await fetch(base + "/api/health");
  assert.notEqual(a.headers.get("x-request-id"), "untrusted-id");
  assert.notEqual(a.headers.get("x-request-id"), b.headers.get("x-request-id"));
});
