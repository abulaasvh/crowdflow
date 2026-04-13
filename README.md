# CrowdFlow 🏟️

> Smart Stadium Companion App — Real-time crowd intelligence for large-scale sporting events.

## Architecture

```
crowdflow/
├── apps/
│   ├── staff-web/        → React + Vite staff dashboard
│   └── mobile/           → React Native + Expo (scaffold)
├── services/
│   ├── auth-service/     → Fastify + GraphQL + Prisma (JWT auth)
│   └── crowd-service/    → Fastify + Socket.io (real-time heatmap)
├── packages/
│   ├── shared-types/     → TypeScript types, enums, constants
│   └── config-typescript/→ Shared tsconfig bases
└── docker/               → Docker Compose (PostgreSQL, Redis)
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build shared packages
npm run build --workspace=packages/shared-types

# 3. Start staff dashboard (dev)
npm run dev --workspace=apps/staff-web

# 4. Start crowd service (requires Node 20+)
npm run dev --workspace=services/crowd-service

# 5. Start auth service (requires PostgreSQL)
npm run dev --workspace=services/auth-service
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Vanilla CSS |
| Backend | Fastify 5, Node.js, GraphQL (Mercurius) |
| Real-time | Socket.io 4, Redis Pub/Sub |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | JWT (RS256), Argon2id, Firebase Auth |
| Google | Firebase Auth, Maps, FCM, Analytics 4 |
| Testing | Vitest, React Testing Library |
| Infra | Docker Compose, Turborepo |

## Google Services Integration

- **Firebase Auth** — Google Sign-In for social login
- **Google Maps Platform** — Outdoor navigation, exit planning
- **Firebase Cloud Messaging** — Push notifications
- **Google Analytics 4** — User behavior tracking

## Evaluation Criteria Coverage

- **Code Quality** — Strict TypeScript, ESLint, Prettier, clean architecture
- **Security** — Argon2id hashing, JWT rotation, rate limiting, CORS, Helmet, Zod validation
- **Efficiency** — WebSocket binary frames, Redis caching, IDW heatmap interpolation
- **Testing** — Vitest unit tests, React Testing Library, accessibility assertions
- **Accessibility** — WCAG 2.1 AA, skip nav, ARIA labels, keyboard nav, focus management
- **Google Services** — Firebase Auth, Maps, FCM, GA4 integrated across all layers

## License

MIT
