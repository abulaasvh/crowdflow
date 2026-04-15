FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY services/order-service ./services/order-service

RUN npm install
RUN npx turbo build --filter=@crowdflow/order-service

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/order-service/dist ./dist
COPY --from=builder /app/services/order-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/order-service/prisma ./prisma

EXPOSE 4003
CMD ["node", "dist/server.js"]
