import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { loadEnv } from "../../src/config/env.js";
import { normalizeError } from "../../src/middlewares/error.middleware.js";
import { validate } from "../../src/middlewares/validate.middleware.js";
import { withTransaction } from "../../src/config/db.js";
import { createRedis } from "../../src/config/redis.js";
import { ApiError } from "../../src/utils/ApiError.js";

const base = {
  DATABASE_URL: "postgresql://user:secret@localhost:5432/dayflow",
  FRONTEND_URL: "http://localhost:3000",
};
test("env validates defaults and explicitly parses false", () => {
  const env = loadEnv(base);
  assert.equal(env.REDIS_ENABLED, false);
  assert.equal(env.DB_SSL, false);
  assert.equal(env.PORT, 4000);
  assert.equal(Object.isFrozen(env), true);
});
test("invalid environment fails without echoing a credential", () => {
  for (const overrides of [
    { DATABASE_URL: "bad-secret-value" },
    { FRONTEND_URL: "bad-secret-value" },
    { PORT: "0" },
    { DB_SSL: "yes" },
    { REDIS_ENABLED: "true", REDIS_URL: "" },
    { DATABASE_URL: base.DATABASE_URL + "?sslmode=disable" },
    { DB_QUERY_TIMEOUT_MS: "1000" },
  ]) {
    assert.throws(
      () => loadEnv({ ...base, ...overrides }),
      (error) =>
        error.message.startsWith("Invalid environment configuration:") &&
        !error.message.includes("bad-secret-value"),
    );
  }
});
test("valid enabled Redis accepts a URL and disabled Redis needs no connection", async () => {
  assert.equal(
    loadEnv({
      ...base,
      REDIS_ENABLED: "true",
      REDIS_URL: "redis://localhost:6379",
    }).REDIS_ENABLED,
    true,
  );
  const redis = createRedis(loadEnv(base), {});
  assert.equal(redis.enabled, false);
  await redis.connect();
  await redis.ping();
  await redis.close();
});
test("unexpected errors never expose stack, SQL or raw messages", () => {
  const error = normalizeError(
    new Error("SELECT password_hash secret FROM users"),
  );
  assert.equal(error.statusCode, 500);
  assert.equal(error.code, "INTERNAL_ERROR");
  assert.equal(error.message.includes("password_hash"), false);
  assert.equal(error.details, null);
});
test("driver and parser failures map to stable public codes", () => {
  for (const [input, status, code] of [
    [{ code: "23505", detail: "secret email" }, 409, "RESOURCE_CONFLICT"],
    [{ code: "23503" }, 422, "INVALID_DATA"],
    [{ code: "57014" }, 503, "DATABASE_TIMEOUT"],
    [{ code: "ECONNREFUSED" }, 503, "DEPENDENCY_UNAVAILABLE"],
    [{ type: "entity.parse.failed", body: "secret" }, 400, "INVALID_JSON"],
    [{ type: "entity.too.large" }, 413, "PAYLOAD_TOO_LARGE"],
    [{ type: "charset.unsupported" }, 415, "UNSUPPORTED_ENCODING"],
  ]) {
    const error = normalizeError(input);
    assert.equal(error.statusCode, status);
    assert.equal(error.code, code);
    assert.equal(error.message.includes("secret"), false);
  }
});
test("ApiError validates status and retains intended public messages", () => {
  assert.throws(() => new ApiError(200, "BAD", "bad"), TypeError);
  const error = new ApiError(404, "TODO_NOT_FOUND", "Task not found.");
  assert.equal(normalizeError(error), error);
});
test("validation stores sanitized values separately and reports safe field errors", () => {
  const schema = z.object({ title: z.string().trim().min(1) }).strict();
  const req = { body: { title: "  Read the docs  " } };
  const res = { locals: {} };
  validate(schema)(req, res, (error) => assert.equal(error, undefined));
  assert.equal(res.locals.validated.body.title, "Read the docs");
  assert.equal(req.body.title, "  Read the docs  ");
  validate(schema)({ body: { title: "" } }, { locals: {} }, (error) => {
    const normalized = normalizeError(error);
    assert.equal(normalized.statusCode, 422);
    assert.equal(normalized.details[0].field, "title");
  });
});
function fakePool(failRollback = false) {
  const calls = [];
  const client = {
    query: async (sql) => {
      calls.push(sql);
      if (sql === "ROLLBACK" && failRollback)
        throw new Error("rollback failed");
    },
    release: (discard) => calls.push(["release", discard]),
  };
  return { calls, client, pool: { connect: async () => client } };
}
test("transactions commit with the same client and release it", async () => {
  const { pool, client, calls } = fakePool();
  const value = await withTransaction(pool, async (checkedOut) => {
    assert.equal(checkedOut, client);
    await checkedOut.query("WORK");
    return 42;
  });
  assert.equal(value, 42);
  assert.deepEqual(calls, ["BEGIN", "WORK", "COMMIT", ["release", false]]);
});
test("transaction failure rolls back and preserves the original error", async () => {
  const { pool, calls } = fakePool();
  const expected = new Error("work failed");
  await assert.rejects(
    withTransaction(pool, async () => {
      throw expected;
    }),
    (error) => error === expected,
  );
  assert.deepEqual(calls, ["BEGIN", "ROLLBACK", ["release", false]]);
});
test("failed rollback destroys the connection instead of leaking it into the pool", async () => {
  const { pool, calls } = fakePool(true);
  await assert.rejects(
    withTransaction(pool, async () => {
      throw new Error("work failed");
    }),
    /work failed/,
  );
  assert.deepEqual(calls, ["BEGIN", "ROLLBACK", ["release", true]]);
});

test("response helpers reject statuses incompatible with their envelope", async () => {
  const { sendSuccess, sendError } =
    await import("../../src/utils/response.js");
  assert.throws(() => sendSuccess({}, { status: 500 }), TypeError);
  assert.throws(() => sendSuccess({}, { status: 204 }), TypeError);
  assert.throws(() => sendError({}, { status: 200 }), TypeError);
});
