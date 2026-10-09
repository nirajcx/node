import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

function run(overrides) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["src/server.js"], {
      env: {
        ...process.env,
        NODE_ENV: "test",
        FRONTEND_URL: "http://localhost:3000",
        DATABASE_URL:
          "postgresql://test:private-test-password@127.0.0.1:1/dayflow",
        DB_CONNECT_TIMEOUT_MS: "100",
        REDIS_ENABLED: "false",
        LOG_LEVEL: "silent",
        ...overrides,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Startup exceeded the test deadline"));
    }, 5000);
    child.stdout.on("data", (data) => {
      output += data;
    });
    child.stderr.on("data", (data) => {
      output += data;
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}
test("invalid configuration exits nonzero without exposing its value", async () => {
  const result = await run({ DATABASE_URL: "private-invalid-url" });
  assert.equal(result.code, 1);
  assert.equal(result.output.includes("private-invalid-url"), false);
});
test("unreachable PostgreSQL fails startup within a deadline without printing credentials", async () => {
  const result = await run({});
  assert.equal(result.code, 1);
  assert.equal(result.output.includes("private-test-password"), false);
});
