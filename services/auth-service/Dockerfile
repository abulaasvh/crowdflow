# Base image for building
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (utilizing monorepo structure)
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY services/auth-service ./services/auth-service

# Install all node_modules (monorepo root)
RUN npm install

# Build the auth service
RUN npx prisma generate --schema=services/auth-service/prisma/schema.prisma
RUN npx turbo build --filter=@crowdflow/auth-service

# Final stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/auth-service/dist ./dist
COPY --from=builder /app/services/auth-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/auth-service/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/server.js"]
