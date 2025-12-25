// src/common/auth/refreshTokenStore.js
const { getRedis } = require("../common/redis");

// ================================
// 공통
// ================================
function redisEnabled() {
  return process.env.USE_REDIS === "true";
}

// 키 설계: refresh:<userId>:<jti>
function keyOf(userId, jti) {
  return `refresh:${userId}:${jti}`;
}

// ================================
// 메모리 fallback (로컬용)
// ================================
// key -> expiresAt(ms)
const memoryStore = new Map();

function memSet(key, ttlSeconds) {
  memoryStore.set(key, Date.now() + ttlSeconds * 1000);
}

function memExists(key) {
  const expiresAt = memoryStore.get(key);
  if (!expiresAt) return false;

  if (Date.now() > expiresAt) {
    memoryStore.delete(key);
    return false;
  }
  return true;
}

function memDelete(key) {
  memoryStore.delete(key);
}

// ================================
// 저장 (TTL = refresh 만료시간과 동일)
// ================================
async function saveRefreshToken({ userId, jti, ttlSeconds }) {
  const key = keyOf(userId, jti);

  // ✅ Redis 사용 가능할 때
  if (redisEnabled()) {
    const redis = await getRedis();
    if (!redis) {
      throw new Error("Redis enabled but client not available");
    }
    await redis.set(key, "1", { EX: ttlSeconds });
    return key;
  }

  // ✅ 로컬 fallback (메모리)
  memSet(key, ttlSeconds);
  return key;
}

// ================================
// 존재 확인
// ================================
async function existsRefreshToken({ userId, jti }) {
  const key = keyOf(userId, jti);

  if (redisEnabled()) {
    const redis = await getRedis();
    if (!redis) return false;
    const v = await redis.get(key);
    return !!v;
  }

  return memExists(key);
}

// ================================
// 삭제 (로그아웃 / 회전 시)
// ================================
async function deleteRefreshToken({ userId, jti }) {
  const key = keyOf(userId, jti);

  if (redisEnabled()) {
    const redis = await getRedis();
    if (!redis) return;
    await redis.del(key);
    return;
  }

  memDelete(key);
}

module.exports = {
  saveRefreshToken,
  existsRefreshToken,
  deleteRefreshToken,
};
