# Base image for building
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (utilizing monorepo structure)
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY services/notification-service ./services/notification-service

# Install all node_modules (monorepo root)
RUN npm install

# Build the notification service
RUN npx turbo build --filter=@crowdflow/notification-service

# Final stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/notification-service/dist ./dist
COPY --from=builder /app/services/notification-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 4005
CMD ["node", "dist/server.js"]
