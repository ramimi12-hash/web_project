// src/common/redis.js
const { createClient } = require("redis");

let client = null;

function isRedisEnabled() {
  return process.env.USE_REDIS === "true";
}

async function getRedis() {
  // ✅ 로컬에서는 Redis 연결 시도 자체를 안 함
  if (!isRedisEnabled()) return null;

  if (client && client.isOpen) return client;

  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  client = createClient({ url });

  client.on("error", (err) => console.error("[redis] error:", err));

  if (!client.isOpen) {
    await client.connect();
    console.log("[redis] connected:", url);
  }

  return client;
}

module.exports = { getRedis };
