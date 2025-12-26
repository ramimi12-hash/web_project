FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# ✅ Prisma Client 생성 (이 줄 추가!!)
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "src/server.js"]
