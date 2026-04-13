FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY services/crowd-service ./services/crowd-service

RUN npm install
RUN npx turbo build --filter=@crowdflow/crowd-service

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/crowd-service/dist ./dist
COPY --from=builder /app/services/crowd-service/package.json ./
COPY --from=builder /app/services/crowd-service/node_modules ./node_modules

EXPOSE 4001 4002
CMD ["node", "dist/server.js"]
