const bcrypt = require("bcrypt");
const { signAccessToken } = require("../jwt");

// 임시 사용자(나중에 DB로 교체)
const USERS = [
  {
    id: 1,
    email: "admin@test.com",
    passwordHash: bcrypt.hashSync("1234", 10),
    role: "ADMIN",
  },
  {
    id: 2,
    email: "staff@test.com",
    passwordHash: bcrypt.hashSync("1234", 10),
    role: "STAFF",
  },
];

async function login(email, password) {
  const user = USERS.find((u) => u.email === email);
  if (!user) {
    const err = new Error("INVALID_CREDENTIALS");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("INVALID_CREDENTIALS");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  return { accessToken };
}

module.exports = { login };
