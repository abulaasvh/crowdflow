FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/staff-web ./apps/staff-web

RUN npm install
RUN npx turbo build --filter=@crowdflow/staff-web

# Serve with Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/staff-web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
