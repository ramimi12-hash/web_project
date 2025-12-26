// src/common/utils/ttl.js
function parseExpiresToSeconds(expiresIn) {
  if (!expiresIn) return 0;
  if (/^\d+$/.test(expiresIn)) return parseInt(expiresIn, 10);

  const m = expiresIn.match(/^(\d+)([smhd])$/);
  if (!m) return 0;

  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  return n * mult;
}
module.exports = { parseExpiresToSeconds };
