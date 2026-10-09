import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { createRedis } from '../../src/config/redis.js';

// A disposable TCP server, never the user's Redis service. It intentionally does
// not complete the Redis handshake, proving our overall connection deadline.
test('Redis handshake timeout closes its socket instead of hanging startup', async t => {
  const sockets = new Set();
  const server = createServer(socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.on('error', () => {}); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); });
  const redis = createRedis({ REDIS_ENABLED: true, REDIS_URL: `redis://127.0.0.1:${server.address().port}`, REDIS_CONNECT_TIMEOUT_MS: 100 }, { error() {} });
  const start = performance.now();
  try {
    await assert.rejects(redis.connect(), /timed out/);
    assert.ok(performance.now() - start < 2000);
    await assert.rejects(redis.ping(), /not ready/);
  } finally { await redis.close(); }
});
