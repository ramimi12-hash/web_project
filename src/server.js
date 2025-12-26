// server.js
require("dotenv").config();

const app = require("./app");
const { getRedis } = require("./common/redis"); // 경로는 server.js 위치 기준으로 맞추기

const PORT = process.env.PORT || 8080;

async function bootstrap() {
  try {
    // ✅ USE_REDIS=true일 때만 실제 연결됨 (false면 null 반환)
    await getRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

bootstrap();
